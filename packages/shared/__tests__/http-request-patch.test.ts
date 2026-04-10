import { Observable, of } from "rxjs";
import { patchedRunHttpRequest } from "../http-request-patch";

describe("patchedRunHttpRequest", () => {
  it("delegates to originalRunHttpRequest in non-RN environment", () => {
    const mockEvent = { type: "headers", status: 200, headers: new Headers() };
    const original = vi.fn(
      () => of(mockEvent) as Observable<any>,
    );

    const obs = patchedRunHttpRequest(
      "https://api.example.com",
      { method: "POST", body: "{}" },
      original,
    );

    let result: any;
    obs.subscribe((val) => {
      result = val;
    });

    expect(original).toHaveBeenCalledWith("https://api.example.com", {
      method: "POST",
      body: "{}",
    });
    expect(result).toBe(mockEvent);
  });

  it("passes through url and requestInit unchanged", () => {
    const original = vi.fn(() => of({ type: "data" }) as Observable<any>);
    const headers = { "Content-Type": "application/json", Authorization: "Bearer tok" };
    const init: RequestInit = {
      method: "POST",
      headers,
      body: '{"msg":"hi"}',
    };

    patchedRunHttpRequest("https://rt.example.com/run", init, original);

    expect(original).toHaveBeenCalledWith("https://rt.example.com/run", init);
  });
});
