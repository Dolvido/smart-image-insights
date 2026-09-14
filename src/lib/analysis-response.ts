export interface AnalysisResult {
  objects: Array<{ label: string; confidence?: number }>;
  caption: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Accept the FastAPI response without inventing scores or converting captions into classifications.
export function parseAnalysisResponse(data: unknown): AnalysisResult {
  if (!isRecord(data) || data.mock === true || data.demo === true) {
    throw new Error('The service did not return an inference result.');
  }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    throw new Error('The service could not complete image analysis.');
  }
  if (!Array.isArray(data.results) || data.results.length !== 1) {
    throw new Error('The service returned no valid result for this image.');
  }
  const result = data.results[0];
  if (!isRecord(result)) {
    throw new Error('The service returned an invalid image result.');
  }
  // Model failures must remain failures even when the backend responds with HTTP 200.
  if (isRecord(result.errors) && Object.values(result.errors).some(Boolean)) {
    throw new Error('One or more image models could not complete analysis. Please try again.');
  }
  if (!Array.isArray(result.objects) || typeof result.caption !== 'string' || !result.caption.trim()) {
    throw new Error('The service returned an incomplete image result.');
  }
  const objects = result.objects.map((object: unknown) => {
    if (!isRecord(object) || typeof object.label !== 'string' || !object.label.trim()) {
      throw new Error('The service returned an invalid object detection.');
    }
    const confidence = object.confidence;
    if (confidence !== undefined && (
      typeof confidence !== 'number' || !Number.isFinite(confidence) ||
      confidence < 0 || confidence > 1
    )) {
      throw new Error('The service returned an invalid detection confidence.');
    }
    return { label: object.label, ...(confidence === undefined ? {} : { confidence }) };
  });
  return { objects, caption: result.caption };
}

export async function requestImageAnalysis(
  formData: FormData,
  apiBaseUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<AnalysisResult> {
  const response = await fetcher(`${apiBaseUrl.replace(/\/$/, '')}/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Image analysis failed (HTTP ${response.status}). Please try again.`);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('The image service returned an unreadable response. Please try again.');
  }
  return parseAnalysisResponse(data);
}
