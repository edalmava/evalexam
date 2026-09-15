import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scanAnswerSheet, getScanApiUrl } from './scanApiClient';
import { ScanError } from './scanAnswerSheet';

const makeResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: vi.fn(async () => JSON.stringify(body)),
});

describe('scanApiClient - RF-17/RF-24', () => {
  const originalUrl = process.env.EXPO_PUBLIC_SCAN_API_URL;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env.EXPO_PUBLIC_SCAN_API_URL = 'http://test.local';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalUrl === undefined) {
      delete process.env.EXPO_PUBLIC_SCAN_API_URL;
    } else {
      process.env.EXPO_PUBLIC_SCAN_API_URL = originalUrl;
    }
  });

  it('getScanApiUrl usa la variable EXPO_PUBLIC_SCAN_API_URL', () => {
    expect(getScanApiUrl()).toBe('http://test.local');
  });

  it('lee el body UNA sola vez y devuelve respuestas validadas en 200', async () => {
    const mockedFetch = vi.mocked(fetch);
    const response = makeResponse({ answers: ['A', 'B', '', 'D'] });
    mockedFetch.mockResolvedValue(response as unknown as Response);

    const result = await scanAnswerSheet({
      imageBase64: 'aGVsbG8=',
      mimeType: 'image/jpeg',
      totalQuestions: 4,
      columns: 2,
    });

    expect(response.text).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ answers: ['A', 'B', null, 'D'], warnings: [] });
  });

  it('mapea el cuerpo de error a UPSTREAM_ERROR sin romper el parseo', async () => {
    const mockedFetch = vi.mocked(fetch);
    mockedFetch.mockResolvedValue(
      makeResponse({ message: 'El modelo falló' }, 502) as unknown as Response,
    );

    await expect(
      scanAnswerSheet({ imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg', totalQuestions: 3, columns: 2 }),
    ).rejects.toMatchObject({ code: 'UPSTREAM_ERROR', message: 'El modelo falló' });
  });

  it('lanza NETWORK_ERROR incluyendo la URL cuando fetch rechaza', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Network request failed'));

    await expect(
      scanAnswerSheet({ imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg', totalQuestions: 3, columns: 2 }),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR', message: expect.stringContaining('http://test.local') });
  });

  it('lanza PARSE_ERROR cuando el body 200 no es JSON válido', async () => {
    const mockedFetch = vi.mocked(fetch);
    const response = {
      ok: true,
      status: 200,
      text: vi.fn(async () => '<html>error</html>'),
    };
    mockedFetch.mockResolvedValue(response as unknown as Response);

    await expect(
      scanAnswerSheet({ imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg', totalQuestions: 3, columns: 2 }),
    ).rejects.toThrow(ScanError);
    await expect(
      scanAnswerSheet({ imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg', totalQuestions: 3, columns: 2 }),
    ).rejects.toMatchObject({ code: 'PARSE_ERROR' });
  });

  it('clasifica como TIMEOUT un abort que no se reporta como AbortError', async () => {
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new TypeError('Network request failed')),
          );
        }),
    );

    await expect(
      scanAnswerSheet(
        { imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg', totalQuestions: 3, columns: 2 },
        1,
      ),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
  });
});