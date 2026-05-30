describe("mobile api base url", () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as typeof globalThis & { API_BASE?: string }).API_BASE;
  });

  function loadApiBase(constants: unknown) {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: constants,
    }));

    return require("../src/services/api") as typeof import("../src/services/api");
  }

  it("uses the explicit app config api url when provided", () => {
    const { getApiBase } = loadApiBase({
      expoConfig: {
        extra: { apiBaseUrl: "https://example.com/copa-api/" },
      },
    });

    expect(getApiBase()).toBe("https://example.com/copa-api");
  });

  it("infers the local api host from Expo dev server instead of localhost", () => {
    const { getApiBase } = loadApiBase({
      expoConfig: {
        hostUri: "192.168.15.20:8081",
        extra: {},
      },
    });

    expect(getApiBase()).toBe("http://192.168.15.20:3000");
  });

  it("falls back to the production api for standalone builds without env", () => {
    const { getApiBase } = loadApiBase({
      expoConfig: {
        extra: {},
      },
    });

    expect(getApiBase()).toBe("https://deyllonramos.cloud/copa-api");
  });
});
