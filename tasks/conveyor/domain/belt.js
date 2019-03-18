import {Hand, HAND_WIDTH, LEN0} from "./hand";
import {Detail, DR, R0} from "./detail";
import {TranslatedMouse} from "../mouse";

const TIME_HAND_DOWN_UP = 1;
const TIME_MOVE = 2;
const TIME_PERIOD = 2 * TIME_HAND_DOWN_UP + TIME_MOVE;
const DIST_MOVE = 40;

export class Belt {

    initial_rays;

    x = 0;
    y = 0;
    max_width;
    _time = 0;
    _program; //array of numbers from 1 to t
    detail;
    step;
    step_index;
    hands;
    rotations; //array of int (0 = no rotation)

    mouse;
    bg;
    program_changed_handler;

    constructor(initial_rays, x, y, max_width, mouse, kioapi, program_changed_handler) {
        this.initial_rays = initial_rays;
        this.t = Math.max(...this.initial_rays);
        this.detail = new Detail(initial_rays);
        this.program_changed_handler = program_changed_handler;
        this.max_width = max_width;

        this.x = x;
        this.y = y;
        this.mouse = new TranslatedMouse(mouse, x, y);

        this.bg = kioapi.getResource('belt');

        this._program = [];
        this._update_hands();
        this._update_rotations();
    }

    set program(value) {
        this._program = value;
        this._update_hands();
        this._update_rotations();
        this._update_time();
    }

    _update_time() {
        this.step_index = Math.floor(this._time / TIME_PERIOD);
        let step_time = this._time - this.step_index * TIME_PERIOD;

        if (step_time < 2 * TIME_HAND_DOWN_UP)
            this._update_time_hand(step_time);
        else
            this._update_time_move(step_time - 2 * TIME_HAND_DOWN_UP);
    }

    _update_time_hand(step_time) {
        this.step = 'hand down';
        this.detail.x = DIST_MOVE * this.step_index;
        this._reset_all_hands();
        let current_rotation = this.rotations[this.step_index];
        if (this.step_index < this.hands.length)
            this.hands[this.step_index].set_out(
                this.detail.rays[current_rotation],
                step_time / (2 * TIME_HAND_DOWN_UP),
                this.detail,
                current_rotation,
                this.rotations[this.step_index + 1],
            );
    }

    _update_time_move(step_time) {
        this.step = 'move';
        this.detail.x = DIST_MOVE * this.step_index + DIST_MOVE * step_time / TIME_MOVE;
        this._reset_all_hands();

        //rotate detail
        if (this.step_index + 1 < this.rotations.length) {
            let r0 = this.rotations[this.step_index + 1];
            this.detail.rotation = -2 * Math.PI / this.detail.n * r0; //TODO duplication with Hand.set_out
            this.detail.unhighlight_ray();
        }
    }

    _reset_all_hands() {
        for (let hand of this.hands)
            hand.set_out(1, 0);
    }

    get time() {
        return this._time;
    }

    set time(_time) {
        let max_time = this.max_time();

        this._time = Math.min(_time, max_time);
        this._update_time();
    }

    max_time() {
        let max_time = this._program.length * (2 * TIME_HAND_DOWN_UP + TIME_MOVE) - TIME_MOVE;
        if (max_time < 0)
            max_time = 0;
        return max_time;
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(this.x, this.y);

        ctx.fillStyle = ctx.createPattern(this.bg, 'repeat');
        // ctx.strokeStyle = '#9d490c';
        // ctx.lineWidth = 2;
        let y0 = -3 * DR - R0 - LEN0;
        let x0 = -3 * DR - R0;
        let skips = this._program.length - 1;
        if (skips < 0)
            skips = 0;
        let width0 = DIST_MOVE * skips + 5;

        ctx.save();
        ctx.translate(this.detail.x, 0);
        ctx.fillRect(
            x0 - this.detail.x,
            // y0 - DR * 3 + 6,
            y0 + 16,
            width0 + 6 * DR + 2 * R0,
            2 * R0 + 6 * DR + LEN0 - 22
        );
        ctx.restore();

        /*ctx.strokeRect(
            x0,
            y0 - DR * 3 + 6,
            width0 + 6 * DR + 2 * R0,
            2 * R0 + 6 * DR + LEN0 + 3 * DR - 12
        );*/

        this.detail.draw(ctx);

        for (let hand of this.hands)
            hand.draw(ctx);

        //draw lines
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'green';
        ctx.setLineDash([2, 3]);
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-5, y0 - DR * i - 0.5);

            ctx.lineTo(width0, y0 - DR * i - 0.5);
            ctx.stroke();
        }

        //draw adding new hand
        let added_element_index = this.added_element_index();
        if (added_element_index !== -1) {
            let {i, x, y} = added_element_index;
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'green';
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.fillRect(x - 7, y - 7, 14, 14);
            ctx.strokeRect(x - 7, y - 7, 14, 14);
            ctx.moveTo(x - 4, y);
            ctx.lineTo(x + 4, y);
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x, y + 4);
            ctx.stroke();
        }

        // border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        let h1 = 2 * DR + LEN0 + 10;
        ctx.strokeRect(
            x0,
            y0 + 16 - h1,
            width0 + 6 * DR + 2 * R0,
            2 * R0 + 6 * DR + LEN0 - 22 + h1
        );

        ctx.restore();
    }

    _update_hands() {
        this.hands = new Array(this._program.length);
        let hand_y = this._hand_y();
        for (let i = 0; i < this._program.length; i++) {
            let click_handle = () => {
                let p = this._program.slice();
                p[i] -= 1;
                if (p[i] <= 0)
                    p[i] = this.t;
                this.program_changed_handler(p);
            };

            let close_handle = () => {
                let p = this._program.slice();
                p.splice(i, 1);
                this.program_changed_handler(p);
            };

            let h = new Hand(i * DIST_MOVE, hand_y, this.mouse, click_handle, close_handle);
            h.extrusion = this._program[i];
            // h.dir //TODO implement direction
            this.hands[i] = h;
        }
    }

    _hand_y() {
        return -DR * (this.t - 1) - LEN0 - R0;
    }

    _update_rotations() {
        this.rotations = new Array(this._program.length + 1);
        this.rotations[0] = 0;
        for (let i = 0; i < this._program.length; i++) {
            let r = this.rotations[i];
            let p = this._program[i];

            let ray = this.initial_rays[r];
            if (ray >= p) {
                let r1 = r + 1;
                if (r1 >= this.initial_rays.length)
                    r1 -= this.initial_rays.length;
                if (r1 < 0)
                    r1 += this.initial_rays.length;
                this.rotations[i + 1] = r1;
            } else
                this.rotations[i + 1] = r;
        }
    }

    _outline_rect() {
        let y0 = -3 * DR - R0 - LEN0;
        let x0 = -3 * DR - R0;
        let skips = this._program.length - 1;
        if (skips < 0)
            skips = 0;
        let width0 = DIST_MOVE * skips + 5;

        let h1 = 2 * DR + LEN0 + 10;

        return [
            x0,
            y0 + 16 - h1,
            width0 + 6 * DR + 2 * R0,
            2 * R0 + 6 * DR + LEN0 - 22 + h1
        ];
    }

    mouse_click() {
        let rect = this._outline_rect();
        if (
            rect[0] <= this.mouse.x && this.mouse.x <= rect[0] + rect[2] &&
            rect[1] <= this.mouse.y && this.mouse.y <= rect[1] + rect[3]
        ) {
            console.log('click on belt');

            for (let h of this.hands)
                h.mouse_click();

            let add_index = this.added_element_index();
            if (add_index !== -1) {
                let p = this._program.slice();
                p.splice(add_index.i, 0, this.t);
                this.program_changed_handler(p);
            }
        }
    }

    added_element_index() {
        let hand_y = this._hand_y() - 1.5 * DR;
        for (let i = 0; i <= this.hands.length; i++) {
            let hand_x = -DIST_MOVE / 2 + i * DIST_MOVE;
            if (
                Math.abs(this.mouse.x - hand_x) < DIST_MOVE / 2 - HAND_WIDTH &&
                Math.abs(this.mouse.y - hand_y) < 1.5 * DR
            )
                return {i, x: hand_x, y: hand_y};
        }

        return -1;
    }
}