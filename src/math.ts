import { IPoint } from "./index";
export function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
}

export function subtractVectors(a: IPoint, b: IPoint): IPoint {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    };
}

export function addVectors(a: IPoint, b: IPoint): IPoint {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    };
}

export function multVectorByScalar(a: IPoint, scalar: number): IPoint {
    return {
        x: a.x * scalar,
        y: a.y * scalar,
    };
}

export function normalizeVector(vector: IPoint): IPoint {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) {
        return { x: 0, y: 0 };
    }
    return {
        x: vector.x / length,
        y: vector.y / length,
    };
}

export function dot(a: IPoint, b: IPoint): number {
    return a.x * b.x + a.y * b.y;
}
