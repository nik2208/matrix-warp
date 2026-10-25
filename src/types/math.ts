export type Matrix2x2 = [[number, number], [number, number]];
export type Matrix3x3 = [[number, number], [number, number], [number, number], [number, number]?] | any; // use arrays
export type Matrix2 = number[][];
export type Matrix3 = number[][];
export type Vector2 = [number, number];
export type Vector3 = [number, number, number];

export type Complex = {
  re: number;
  im: number;
};

export type EigenPair = {
  value: Complex;
  vector: number[]; // real approximation or direction
};

export type Metrics = {
  det: number | null;
  trace: number | null;
  rank: number | null;
  normFrobenius: number | null;
  normSpectral: number | null;
  cond: number | null; // kappa, Infinity if singular
  singular: boolean;
  eigenvalues: Complex[];
  eigenvectors: number[][] | null;
  singularValues: number[];
};
