export const calcPercent = function (rawValue: number, maxValue: number, minValue: number): number {
  return ((rawValue - minValue) / (maxValue - minValue)) * 100;
};
