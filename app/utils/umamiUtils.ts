export function buildUmamiAttributes(
  umamiEventData?: Record<string, string>,
): Record<string, string> {
  if (!umamiEventData || Object.keys(umamiEventData).length === 0) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(umamiEventData).map(([key, value]) => [
      `data-umami-event-${key}`,
      value,
    ]),
  );
}
