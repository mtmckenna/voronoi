import { IGameObject, IPoint, IEdge } from "./index";
import { subtractVectors, addVectors, multVectorByScalar, normalizeVector, dot } from "./math";

export function findCollisions(entity: IGameObject, otherEntities: IGameObject[]): IContactInfo[] {

    const collisions: IContactInfo[] = [];

    for (let i = 0; i < otherEntities.length; i++) {
        const other = otherEntities[i];
        const collisionEdge = findCollision(entity, other);
        if (collisionEdge) collisions.push({ gameObject: other, contactEdge: collisionEdge });
    }

    return collisions;
}
function findCollision(entity1: IGameObject, entity2: IGameObject): null | IEdge {
    const contact = getSeparation(entity1, entity2)
    if (contact.depth > 0) return { v0: contact.start, v1: contact.end };
    return null;
}


function normalAtIndex(vertices: IPoint[], index: number): IPoint {
    const edge = edgeAtIndex(vertices, index);
    return normalFromEdge(edge);
}
function normalFromEdge(edge: IPoint): IPoint {
    const normal = { x: edge.y, y: -edge.x };
    return normalizeVector(normal);
}

function edgeAtIndex(vertices: IPoint[], index: number): IPoint {
    const currentVertex = vertices[index];
    const nextVertex = vertices[(index + 1) % vertices.length];
    return subtractVectors(nextVertex, currentVertex);
}

function getSeparation(entity1: IGameObject, entity2: IGameObject): ISeparation {
    const a = findMinSeparation(entity1, entity2);
    const b = findMinSeparation(entity2, entity1);

    const contact: ISeparation = {
        depth: 0,
        normal: {x: 0, y: 0},
        start: {x: 0, y: 0},
        end: { x:0, y: 0},
        a: entity1,
        b: entity2
    };

    if (a.separation >= 0 || b.separation >= 0) return contact;

    if (a.separation > b.separation) {
        contact.depth = -1 * a.separation;
        contact.normal = normalFromEdge(a.axis);
        contact.start = a.point;
        contact.end = addVectors(a.point, multVectorByScalar(contact.normal, contact.depth));
    } else {
        contact.depth = -1 * b.separation;
        contact.normal = multVectorByScalar(normalFromEdge(b.axis), -1);
        contact.end = b.point;
        contact.start = subtractVectors(b.point, multVectorByScalar(contact.normal, contact.depth));
    }

    return contact;
}

// based on pikuma course: https://courses.pikuma.com/courses/take/game-physics-engine-programming/lessons/28546195-polygon-polygon-collision-information
function findMinSeparation(entity1: IGameObject, entity2: IGameObject): { separation: number, axis: IPoint, point: IPoint } {
    const verticesA = generateVertices(entity1);
    const verticesB = generateVertices(entity2);
    let separation = Number.NEGATIVE_INFINITY;
    let axis: IPoint = {x:0,y:0};
    let minVertex = {x:0,y:0};
    let point: IPoint = {x:0,y:0};

    let i = 0;
    for (const va of verticesA) {
        const normal = normalAtIndex(verticesA, i);
        let minOverlap = Number.POSITIVE_INFINITY;
        for (const vb of verticesB) {
            const dotProduct = dot(subtractVectors(vb, va), normal);
            if (dotProduct < minOverlap) {
                minOverlap = dotProduct
                minVertex = vb;
            }
        }

        if (minOverlap > separation) {
            separation = minOverlap;
            axis = edgeAtIndex(verticesA, i);
            point = minVertex;
        }
        i++;
    }

    return { separation, axis, point };
}

function generateVertices(entity: IGameObject): IPoint[] {
    const { middlePos, size, angle } = entity;
    const { x: width, y: height } = size;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const vertices: IPoint[] = [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 },

    ];

    for (const vertex of vertices) {
        const { x, y } = vertex;
        vertex.x = x * cosAngle - y * sinAngle + middlePos.x;
        vertex.y = x * sinAngle + y * cosAngle + middlePos.y;
    }

    return vertices;
}

interface ISeparation {
    depth: number;
    normal: IPoint;
    start: IPoint;
    end:IPoint;
    a: IGameObject;
    b: IGameObject;
}

export interface IContactInfo {
    gameObject: IGameObject;
    contactEdge: IEdge;
}