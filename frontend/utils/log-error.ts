function logError(error: unknown, info?: string) {
  if (process.env.NODE_ENV === "development") {
    console.error(error, info);
  } else {
    // to implement in solution for prod
  }
}
