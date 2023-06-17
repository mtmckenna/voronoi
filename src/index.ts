import {Joystick, KeyboardInput} from "./input";
import { randomFloat } from "./math";
import {Player, Road} from "./game_objects";
import {findCollisions, IContactInfo} from "./collision";

const canvas: HTMLCanvasElement = document.createElement("canvas");
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");

const gameSize: IPoint = { x: 500, y: 500 };

canvas.id = "game";
canvas.width = gameSize.x;
canvas.height = gameSize.y;
const div = document.createElement("div");
div.appendChild(canvas);
document.body.appendChild(canvas);

const NUM_POINTS = 10;
const ROAD_WIDTH = 30;

const joystick = new Joystick(canvas, joystickMoveCallback);
new KeyboardInput(window, keyCallback);
const inputState: IPoint = { x:0, y: 0 };
const player = new Player(gameSize, inputState);
const points: IPoint[] = [];

for (let i = 0; i < NUM_POINTS; i++) {
    points.push({
        x: randomFloat(0, gameSize.x),
        y: randomFloat(0, gameSize.y),
    });
}

const roads = voronoiEdgesOfDelaunayTriangles(triangulate(points)).map((edge) => roadFromEdge(edge));
function tick(t: number) {
    requestAnimationFrame(tick);

    const collisions = findCollisions(player, roads);
    const collidedRoads = collisions.map((collision) => collision.gameObject);

    // reset road colors
    for (const road of roads) {
        collidedRoads.includes(road) ? road.color = "#00ccbb" : road.color = road.originalRoadColor;
    }

    player.update();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawVoronoiPoints(ctx, points);
    drawRoads(ctx, roads);
    player.draw(ctx);

    drawCollisions(ctx, collisions);

    joystick.draw(ctx);
}

requestAnimationFrame(tick);

function drawCollisions(ctx: CanvasRenderingContext2D, collisions: IContactInfo[]) {
    for (const collision of collisions) {
        ctx.strokeStyle = "#f00";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(collision.contactEdge.v0.x, collision.contactEdge.v0.y);
        ctx.lineTo(collision.contactEdge.v1.x, collision.contactEdge.v1.y);
        ctx.stroke();
    }
}
function drawRoads(ctx: CanvasRenderingContext2D, roads: Road[]) {
    for (const road of roads) {
        road.draw(ctx);
    }
}
function drawVoronoiPoints(ctx: CanvasRenderingContext2D, points: IPoint[]) {
    ctx.fillStyle = "#000";
    for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}
function voronoiEdgesOfDelaunayTriangles(triangles: ITriangleInTriangulation[]): IEdge[] {
    // calculate neighbors on each triangle
    for (const triangle of triangles) {
        const neighbors = neighborDelaunayTriangles(triangle, triangles);
        triangle.neighbors = [...neighbors];
    }

    const voronoiEdges: IEdge[] = [];
    for (const triangle of triangles) {
        for (const neighbor of triangle.neighbors) {
            const triangleCenter = triangle.circumcircle.center;
            const neighborCenter = neighbor.circumcircle.center;
            const edge: IEdge = { v0: triangleCenter, v1: neighborCenter };
            if (!edgeListContainsEdge(voronoiEdges, edge)) voronoiEdges.push(edge);
        }
    }
    return voronoiEdges;
}
function perpendicularBisector(start: IPoint, end: IPoint): IEdge {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const directionX = end.y - start.y;
    const directionY = -(end.x - start.x);
    const length = Math.hypot(directionX, directionY);
    const normalizedDirectionX = directionX / length;
    const normalizedDirectionY = directionY / length;

    const edge: IEdge = {
        v0: {
            x: midX + normalizedDirectionX,
            y: midY + normalizedDirectionY,
        },
        v1: {
            x: midX - normalizedDirectionX,
            y: midY - normalizedDirectionY,
        },
    };

    return edge;
}
// function circleFromPoints(points: IPoint[]): ICircle {
//     return welzl(points, []);
// }

function circleFromPoints(points: IPoint[]): ICircle {
    const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    center.x /= points.length;
    center.y /= points.length;

    const radius = points.reduce((max, point) => Math.max(max, distanceBetweenPoints(center, point)), 0);

    return { center, radius };
}

// function welzl(points: IPoint[], boundary: IPoint[]): ICircle {
//     if (points.length === 0 || boundary.length === 3) {
//         if (boundary.length === 0) {
//             return makeCircle({ x: 0, y: 0 }, 0);
//         } else if (boundary.length === 1) {
//             return makeCircle(boundary[0], 0);
//         } else if (boundary.length === 2) {
//             const center = {
//                 x: (boundary[0].x + boundary[1].x) / 2,
//                 y: (boundary[0].y + boundary[1].y) / 2,
//             };
//
//             const radius = distanceBetweenPoints(boundary[0], boundary[1]) / 2;
//             return makeCircle(center, radius);
//         } else {
//             return circumcircleOfTriangle({ v0: boundary[0], v1: boundary[1], v2: boundary[2] })
//         }
//     }
//
//     const point = points[points.length - 1];
//     const circle = welzl(points.slice(0, -1), boundary);
//
//     if (distanceBetweenPoints(circle.center, point) <= circle.radius) {
//         return circle;
//     }
//
//     return welzl(points.slice(0, -1), boundary.concat(point));
// }

function circumcircleOfTriangle(triangle: ITriangle): ICircle {
    const p0 = triangle.v0;
    const p1 = triangle.v1;
    const p2 = triangle.v2;

    // Calculate bisectors of triangle sides
    const bisector01 = perpendicularBisector(p0, p1);
    const bisector12 = perpendicularBisector(p1, p2);

    // Calculate intersection of bisectors (circumcenter)
    const center = edgeIntersection(bisector01, bisector12);

    return {
        center,
        radius: distanceBetweenPoints(center, p0),
    };
}

function edgeIntersection(edg1: IEdge, edge2: IEdge): IPoint | null {
    const x1 = edg1.v0.x;
    const y1 = edg1.v0.y;
    const x2 = edg1.v1.x;
    const y2 = edg1.v1.y;

    const x3 = edge2.v0.x;
    const y3 = edge2.v0.y;
    const x4 = edge2.v1.x;
    const y4 = edge2.v1.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    // Check if the lines are parallel or coincident
    if (denominator === 0) return null;

    const intersectX =
        ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
        denominator;
    const intersectY =
        ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
        denominator;

    return { x: intersectX, y: intersectY };
}

// Create a triangle that contains the circle using 30-60-90 triangle rules: https://www.youtube.com/watch?v=mulFsXCBw80
// Note that the video above has a mistake (the half side is r * sqrt(3) not r * sqrt(2))
function circumscribingTriangle(circle: ICircle): ITriangle {
    let { center, radius } = circle;

    // Calculate the bottom side of the 30-60-90 triangle, which is half the length of the side of the equilateral triangle
    const side = radius * Math.sqrt(3);
    // Calculate the hypotenuse of the 30-60-90 triangle, which is the radius of the circumcircle of the equilateral triangle
    const hypotenuse = radius * 2;

    // Top
    const v0 = {
        x: center.x,
        y: center.y + hypotenuse
    };

    // Left bottom
    const v1 = {
        x: center.x - side,
        y: center.y - radius
    };

    // Right bottom
    const v2 = {
        x: center.x + side,
        y: center.y - radius
    };

    return { v0, v1, v2 };
}

// https://www.gorillasun.de/blog/bowyer-watson-algorithm-for-delaunay-triangulation/#the-super-triangle
function triangulate(vertices: IPoint[]): ITriangleInTriangulation[] {
    // Create bounding 'super' triangle
    const superTriangle = circumscribingTriangle(circleFromPoints(vertices));
    const superDelaunayTriangle = { circumcircle: circumcircleOfTriangle(superTriangle), neighbors: [], ...superTriangle};

    // Initialize triangles while adding bounding triangle
    let triangles: ITriangleInTriangulation[] = [superDelaunayTriangle];

    // Add each vertex to the triangulation
    vertices.forEach((vertex) => {
        triangles = addVertexToTriangulation(vertex, triangles);
    });

    return triangles;
};


function addVertexToTriangulation(vertex: IPoint, triangles: ITriangleInTriangulation[]): ITriangleInTriangulation[] {
    let edges = [];

    // Remove triangles with circumcircles containing the vertex
    const trianglesToKeep = triangles.filter((triangle) => {
        if (isPointInCircumcircle(vertex, triangle)) {
            // Add edges of removed triangle to edge list
            edges.push({v0: triangle.v0, v1: triangle.v1});
            edges.push({v0: triangle.v1, v1: triangle.v2});
            edges.push({v0: triangle.v2, v1: triangle.v0});
            return false;
        }
        return true;
    });

    // Get unique edges
    edges = uniqueEdges(edges);

    // Create new triangles from the unique edges of the removed triangles and the new vertex
    edges.forEach(function(edge) {
        const circumcircle = circumcircleOfTriangle({v0: edge.v0, v1: edge.v1, v2: vertex});
        trianglesToKeep.push({ v0: edge.v0, v1: edge.v1, v2: vertex, circumcircle, neighbors: []});
    });

    return trianglesToKeep;
};

function isPointInCircumcircle(point: IPoint, triangle: ITriangle): boolean {
    const circle = circumcircleOfTriangle(triangle);

    const dx = point.x - circle.center.x;
    const dy = point.y - circle.center.y;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared <= circle.radius * circle.radius;
}

 function uniqueEdges(edges) {
    const uniqueEdges = [];
    for (let i = 0; i < edges.length; ++i) {
        let isUnique = true;

        // See if edge is unique
        for (let j = 0; j < edges.length; ++j) {
            if (i != j && edgesAreEqual(edges[i], edges[j])) {
                isUnique = false;
                break;
            }
        }

        // Edge is unique, add to unique edges array
        if (isUnique) uniqueEdges.push(edges[i]);
    }

    return uniqueEdges;
};

function roadFromEdge(edge: IEdge): Road {
    const dx = edge.v1.x - edge.v0.x;
    const dy = edge.v1.y - edge.v0.y;

    const angle = Math.atan2(dy, dx) + Math.PI/2;
    const height = Math.hypot(dx, dy);

    // calculate the middle pos
    const middlePos = { x: edge.v0.x + dx / 2, y: edge.v0.y + dy / 2 };

    // calculate the top left pos
    const pos = { x: middlePos.x - ROAD_WIDTH / 2, y: middlePos.y - height / 2 };

    return new Road(pos, { x: ROAD_WIDTH, y: height }, angle);

}

function neighborDelaunayTriangles(targetTriangle: ITriangleInTriangulation, triangles: ITriangleInTriangulation[]): ITriangleInTriangulation[] {
    const neighbors: ITriangleInTriangulation[] = [];

    for (const triangle of triangles) {
        if (isNeighborTriangle(targetTriangle, triangle)) {
            neighbors.push(triangle);
        }
    }

    return neighbors;
}

function isNeighborTriangle(triangle1: ITriangle, triangle2: ITriangle): boolean {
    let sharedVertices = 0;

    if (hasSharedVertex(triangle1.v0, triangle2)) sharedVertices++;
    if (hasSharedVertex(triangle1.v1, triangle2)) sharedVertices++;
    if (hasSharedVertex(triangle1.v2, triangle2)) sharedVertices++;

    return sharedVertices === 2;
}

function hasSharedVertex(vertex: IPoint, triangle: ITriangle): boolean {
    return (
        isSamePoint(vertex, triangle.v0) ||
        isSamePoint(vertex, triangle.v1) ||
        isSamePoint(vertex, triangle.v2)
    );
}

function isSamePoint(point1: IPoint, point2: IPoint): boolean {
    return point1.x === point2.x && point1.y === point2.y;
}


function distanceBetweenPoints(p1: IPoint, p2: IPoint): number {
    return Math.hypot((p1.x - p2.x), (p1.y - p2.y));
}

function edgeListContainsEdge(edgeList: IEdge[], edge: IEdge): boolean {
    for (const e of edgeList) {
        if (edgesAreEqual(e, edge)) return true;
    }

    return false;
}
function edgesAreEqual(e1: IEdge, e2: IEdge): boolean {
    return (e1.v0 === e2.v0 && e1.v1 === e2.v1) || (e1.v0 === e2.v1 && e1.v1 === e2.v0);
}

// INPUT METHODS AND CALLBACKS

function keyCallback(pos: IPoint) {
    inputState.x = pos.x;
    inputState.y = pos.y
}

function joystickMoveCallback(pos: IPoint) {
    inputState.x = pos.x;
    inputState.y = pos.y;
}

function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const canvasRatio = canvas.width / canvas.height;
    const windowRatio = width / height;

    if (windowRatio < canvasRatio) {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${(width / canvasRatio)}px`;
    } else {
        canvas.style.height = `${height}px`;
        canvas.style.width = `${(height * canvasRatio)}px`;
    }
}

resizeCanvas()

window.addEventListener('resize', resizeCanvas);

// INTERFACES
export interface IPoint {
    x: number;
    y: number;
}
export interface IEdge {
    v0: IPoint;
    v1: IPoint;
}

interface ICircle {
    center: IPoint;
    radius: number;
}

interface ITriangle {
    v0: IPoint;
    v1: IPoint;
    v2: IPoint;
}

interface ITriangleInTriangulation extends ITriangle{
    circumcircle: ICircle;
    neighbors: ITriangleInTriangulation[];
}
export interface IGameObject {
    pos: IPoint;
    angle: number;
    size: IPoint;
    color: string;
    middlePos: IPoint;
}