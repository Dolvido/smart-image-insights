import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAnalysisResponse, requestImageAnalysis } from '../src/lib/analysis-response.ts';

const result = (overrides = {}) => ({
  results: [{
    id: 'image-1',
    objects: [{ label: 'cat', confidence: 0 }],
    caption: 'A cat sitting on a chair.',
    errors: { object_detection: null, captioning: null, embedding: null },
    ...overrides,
  }],
});

test('keeps actual zero confidence and returns the caption without a classification', () => {
  assert.deepEqual(parseAnalysisResponse(result()), {
    objects: [{ label: 'cat', confidence: 0 }],
    caption: 'A cat sitting on a chair.',
  });
});

test('does not invent missing confidence or detections', () => {
  assert.deepEqual(parseAnalysisResponse(result({ objects: [{ label: 'cat' }] })).objects, [{ label: 'cat' }]);
  assert.deepEqual(parseAnalysisResponse(result({ objects: [] })).objects, []);
});

test('rejects invalid confidence values', () => {
  for (const confidence of [-1, 1.1, NaN, Infinity, '0.95', null]) {
    assert.throws(() => parseAnalysisResponse(result({ objects: [{ label: 'cat', confidence }] })));
  }
});

test('rejects missing results, explicit mocks, and backend model failures', () => {
  for (const payload of [
    {}, { results: [] }, { results: [null] },
    { ...result(), mock: true }, { ...result(), demo: true },
    { ...result(), errors: ['Could not read image'] },
    result({ errors: { object_detection: 'Detector unavailable' } }),
    result({ errors: { captioning: 'Captioner unavailable' } }),
    result({ caption: '' }),
  ]) {
    assert.throws(() => parseAnalysisResponse(payload));
  }
});

test('sends the upload to the configured backend and returns validated inference', async () => {
  const formData = new FormData();
  formData.append('files', new Blob(['fixture'], { type: 'image/png' }), 'fixture.png');
  const actual = await requestImageAnalysis(formData, 'https://example.test/', async (url, options) => {
    assert.equal(url, 'https://example.test/analyze');
    assert.equal(options.method, 'POST');
    assert.equal(options.body, formData);
    return Response.json(result());
  });
  assert.equal(actual.caption, 'A cat sitting on a chair.');
});

test('HTTP, network, and malformed JSON failures reject without fallback results', async () => {
  const formData = new FormData();
  await assert.rejects(requestImageAnalysis(formData, 'https://example.test', async () =>
    new Response('Unavailable', { status: 503 })), /HTTP 503/);
  await assert.rejects(requestImageAnalysis(formData, 'https://example.test', async () => {
    throw new Error('Network unavailable');
  }), /Network unavailable/);
  await assert.rejects(requestImageAnalysis(formData, 'https://example.test', async () =>
    new Response('not json')), /unreadable response/);
});
