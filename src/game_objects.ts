import {IGameObject, IPoint} from "./index";
import { clamp} from "./math";

abstract class Block implements IGameObject {
    angle: number = 0;
    vel: IPoint = {x: 0, y: 0};
    pos: IPoint = {x: 0, y: 0};
    middlePos: IPoint = {x: 0, y: 0};
    size: IPoint = {x: 16, y: 16};
    color: string = "orange";

    abstract update(): void;

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.middlePos.x, this.middlePos.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);
        ctx.restore();
    }

    updatePos(pos: IPoint) {
        this.pos = pos;
        this.middlePos.x = this.pos.x + this.size.x / 2;
        this.middlePos.y = this.pos.y + this.size.y / 2;
    }
}

export class Player extends Block {
    inputState: IPoint;
    gameSize: IPoint;
    constructor(gameSize: IPoint, inputState: IPoint) {
        super();
        this.gameSize = gameSize;
        this.inputState = inputState;
        this.color = "#b465c7"
        this.updatePos({x: gameSize.x / 2, y: gameSize.y / 2});
        this.size = {x: 25, y: 25};
    }
    update(): void {
        // rotate the player... not sure why I need to do the % Math.PI * 2
        this.angle = (this.angle + 0.01) % (Math.PI * 2);

        const MAX_MOVING_SPEED = 3;
        const VEL_BOOST = .75;
        const FRICTION = 1 - .1;

        this.vel.x += VEL_BOOST * this.inputState.x;
        this.vel.y -= VEL_BOOST * this.inputState.y;

        const currentMagnitude = Math.hypot(this.vel.x, this.vel.y);
        if (currentMagnitude > MAX_MOVING_SPEED) {
            // Scale down the velocity to the maximum magnitude
            this.vel.x = (this.vel.x / currentMagnitude) * MAX_MOVING_SPEED;
            this.vel.y = (this.vel.y / currentMagnitude) * MAX_MOVING_SPEED;
        }

        this.vel.x *= FRICTION;
        this.vel.y *= FRICTION;

        // update player pos but mind the edges of the canvas
        const x = clamp(this.pos.x + this.vel.x, 0, this.gameSize.x - this.size.x);
        const y = clamp(this.pos.y + this.vel.y, 0, this.gameSize.y - this.size.y);
        this.updatePos({x, y});
    }
}

export class Road extends Block {

    originalRoadColor = "#474747";
    constructor(pos: IPoint, size: IPoint, angle: number) {
        super();
        this.pos = pos;
        this.size = size;
        this.angle = angle;
        this.color = this.originalRoadColor;
        this.updatePos(pos);
    }
    update(): void {}
}