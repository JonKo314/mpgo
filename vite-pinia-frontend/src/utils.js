async function _fetch(resource, init) {
  try {
    const defaultInit = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const response = await fetch(
      `/api/${resource}`,
      Object.assign(defaultInit, init)
    );

    if (!response.ok) {
      throw new Error(response.statusText + "(" + response.status + ")");
    }

    const contentType = response.headers.get("content-type");
    if (contentType.includes("text/plain")) {
      const text = await response.text();
      if (text !== "OK") {
        throw new Error(`JSON expected but response was text:\n${text}`);
      }
      return true;
    }

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    throw new Error(`Response has unknown content type: ${contentType}`);
  } catch (error) {
    alert(error);
    throw error;
  }
}

export { _fetch as fetch };
