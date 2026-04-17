// api.ts — connects to FastAPI backend at http://localhost:8000

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(
  method: string,
  url: string,
  body?: any,
  isForm = false,
) {
  const opts: RequestInit = { method, headers: {} };
  if (body) {
    if (isForm) {
      opts.body = body;
    } else {
      (opts.headers as any)["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE_URL}${url}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw { response: { data: { error: err.detail || "Request failed" } } };
  }
  return { data: await res.json() };
}

const api = {
  get: (url: string) => request("GET", url),

  post: async (url: string, data: any, _config?: any) => {
    if (url === "/predict") {
      const fd = new FormData();
      fd.append("patientId", data.patientId);
      fd.append("boneage", String(data.boneage || 120));
      fd.append("gender", data.gender || "Male");
      if (data.xrayFile instanceof File) {
        fd.append("xray", data.xrayFile);
      }
      return request("POST", url, fd, true);
    }

    if (url === "/upload-xray") {
      return request("POST", url, data, true);
    }

    return request("POST", url, data);
  },
};

export default api;

export const getGeminiResponse = async (
  patientId: string,
  message: string,
): Promise<string> => {
  try {
    const res = await request("POST", "/chatbot", { patientId, message });
    return (res.data as any).reply || "I'm sorry, I couldn't process that.";
  } catch {
    return "I'm sorry, I encountered an error. Please try again.";
  }
};
