// Ambient module declarations for optional Google SDKs used at runtime via dynamic import.
// These declarations avoid TypeScript compile errors when the packages are not installed.
declare module "@google/genai";
declare module "@google-cloud/vision";

export {};
