import { IPoint } from "./index";
export class KeyboardInput {

    keyboardInputState: IKeyboardInputState = { left: 0, right: 0, up: 0, down: 0 };
    callback: (pos: IPoint) => void;
    constructor(window: Window, callback: (pos: IPoint) => void) {
        window.addEventListener("keydown", this.keyDownHandler.bind(this), { capture: true, passive: false});
        window.addEventListener("keyup", this.keyUpHandler.bind(this), { capture: true, passive: false});
        this.callback = callback;
    }

    keyDownHandler(e: KeyboardEvent) {
        switch (e.key) {
            case "ArrowLeft":
                this.keyboardInputState.left = 1;
                break;
            case "ArrowRight":
                this.keyboardInputState.right = 1;
                break;
            case "ArrowUp":
                this.keyboardInputState.up = 1;
                break;
            case "ArrowDown":
                this.keyboardInputState.down = 1;
                break;
        }

        this.callback(this.normalizedPos);
    }
    keyUpHandler(e: KeyboardEvent) {
        switch (e.key) {
            case "ArrowLeft":
                this.keyboardInputState.left = 0;
                break;
            case "ArrowRight":
                this.keyboardInputState.right = 0;
                break;
            case "ArrowUp":
                this.keyboardInputState.up = 0;
                break;
            case "ArrowDown":
                this.keyboardInputState.down = 0;
                break;
            default:
                return;
        }

        this.callback(this.normalizedPos);
    }

    get normalizedPos(): IPoint {
        return {
            x: this.keyboardInputState.right - this.keyboardInputState.left,
            y: this.keyboardInputState.up - this.keyboardInputState.down
        };
    }
}

const JOYSTICK_RADIUS = 75;
const JOYSTICK_INNER_RADIUS = JOYSTICK_RADIUS / 2;
export class Joystick {
    canvas: HTMLCanvasElement;
    outerPos: IPoint = { x: 0, y: 0 };
    innerPos: IPoint = { x: 0, y: 0 };
    normalizedPos: IPoint = { x: 0, y: 0 };
    pressed: boolean = false;

    callback: (pos: IPoint) => void;

    constructor(gameCanvas: HTMLCanvasElement, callback: (pos: IPoint) => void) {
        this.canvas = gameCanvas;
        this.callback = callback;

        this.addEventListeners(this.canvas);
    }

    addEventListeners(element: HTMLElement) {
        element.addEventListener("mousedown", this.mousePressed.bind(this), { capture: true, passive: false});
        element.addEventListener("mousemove", this.mouseMoved.bind(this), { capture: true, passive: false});
        element.addEventListener("mouseup", this.inputReleased.bind(this), { capture: true, passive: false});

        element.addEventListener("touchstart", this.touchPressed.bind(this), { capture: true, passive: false});
        element.addEventListener("touchend", this.inputReleased.bind(this), { capture: true, passive: false});

        element.addEventListener("touchmove", this.touchMoved.bind(this),{ capture: true, passive: false});
        element.addEventListener("touchcancel", this.inputReleased.bind(this), { capture: true, passive: false});
    }
    updateNormalizedJoystickPos() {
        this.normalizedPos.x = (this.innerPos.x - this.outerPos.x) / JOYSTICK_RADIUS;
        this.normalizedPos.y = (this.outerPos.y - this.innerPos.y) / JOYSTICK_RADIUS;
    }

    positionFromEvent(e: MouseEvent | TouchEvent) {
        const pos = {x: 0, y: 0};
        const rect = this.canvas.getBoundingClientRect();

        let x = 0;
        let y = 0;

        if (e instanceof MouseEvent) {
            x = e.clientX ;
            y = e.clientY;

        } else if (e instanceof TouchEvent) {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        }

        // set pos to canvas relative position taking scaling into account
        pos.x = (x - rect.left) * (this.canvas.width / rect.width);
        pos.y = (y - rect.top) * (this.canvas.height / rect.height);

        return pos;
    }

    touchPressed(e: TouchEvent) {
        e.preventDefault();
        const pos = this.positionFromEvent(e);
        this.inputPressed(pos.x, pos.y);
    }

    touchMoved(e: TouchEvent) {
        e.preventDefault();
        const pos = this.positionFromEvent(e);
        this.inputMoved(pos.x, pos.y);
    }

    mousePressed(e: MouseEvent) {
        e.preventDefault();
        const pos = this.positionFromEvent(e);
        this.inputPressed(pos.x, pos.y);
    }

    mouseMoved(e: MouseEvent) {
        e.preventDefault();
        const pos = this.positionFromEvent(e);
        this.inputMoved(pos.x, pos.y);
    }

    inputPressed(x: number, y: number) {
        this.pressed = true;
        this.outerPos.x = x;
        this.outerPos.y = y;
        this.innerPos.x = x;
        this.innerPos.y = y;
        this.updateNormalizedJoystickPos();
        this.callback(this.normalizedPos);
    }

    inputMoved(x, y) {
        if (!this.pressed) return;

        const xDiff = x - this.outerPos.x;
        const yDiff = y - this.outerPos.y;
        const magnitude = Math.hypot(xDiff, yDiff);

        this.innerPos.x = x;
        this.innerPos.y = y;
        if (magnitude > JOYSTICK_RADIUS) {
            const xIntersection = xDiff / magnitude * JOYSTICK_RADIUS;
            const yIntersection = yDiff / magnitude * JOYSTICK_RADIUS;
            this.innerPos.x = this.outerPos.x + xIntersection;
            this.innerPos.y = this.outerPos.y + yIntersection;
        }

        this.updateNormalizedJoystickPos();
        this.callback(this.normalizedPos);
    }

    inputReleased(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        e.stopPropagation();

        this.pressed = false;
        this.outerPos.x = 0;
        this.outerPos.y = 0;
        this.innerPos.x = 0;
        this.innerPos.y = 0;
        this.updateNormalizedJoystickPos();
        this.callback(this.normalizedPos);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.pressed) return;
        this.drawOuterJoystick(ctx);
        this.drawInnerJoystick(ctx);
    }
    drawOuterJoystick(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.outerPos.x, this.outerPos.y, JOYSTICK_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }

    drawInnerJoystick(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();

        ctx.arc(
            this.innerPos.x,
            this.innerPos.y,
            JOYSTICK_INNER_RADIUS,
            0,
            2 * Math.PI
        );

        ctx.stroke();
        ctx.closePath();
    }
}

interface IKeyboardInputState {
    left: number;
    right: number;
    up: number;
    down: number;
}
