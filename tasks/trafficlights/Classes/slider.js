if (typeof window === 'undefined')
    window = {};

export class Slider {
    constructor(outer, min_value, max_value, height, img, hover_img/*, ticks, big_ticks*/) { //TODO draw ticks
        this.min_value = min_value;
        this.max_value = max_value;

        this.outer = outer;
        let canvas = document.createElement('canvas');
        let $canvas = $(canvas);
        this.canvas = canvas;
        this.domNode = canvas;
        this.img = img;
        this.hover_img = hover_img;

        this._tik = 0;

        this.canvas.height = height;
        $(window).on('resize', () => this.resize());

        this.redraw();

        $canvas
            .on('mousedown', this.handleMouseDown.bind(this))
            .on('mousemove', this.handleMouseMove.bind(this))
            .on('mouseleave', e => {
                this.is_over = false;
                this.redraw();
            });

        this.window_move = e => {
            // tell the browser we're handling this event
            e.preventDefault();
            e.stopPropagation();
            // get mouse position
            let {x, y} = this.event2point(e);
            // set new thumb & redraw

            this.value = this.position_2_value(x - this.dx);
            this.redraw();
        };

        this.window_up = e => {
            if (e.button === 0)
            {
                this.setup_waiting_mouse_up(false);

                this.value = Math.round(this.value); //-- peter
            }
                
        };

        this.value = min_value;
    }

    set visible_max_value(value) {
        this._visible_max_value = value;
        this.redraw();
    }

    setTik(tik)
    {
        this._tik = tik;
        this.redraw();
    }

    get value() {
        return Math.round(this._value);
    }

    set value_no_fire(value) {
        if (value < this.min_value)
            value = this.min_value;
        if (value > this.max_value)
            value = this.max_value;
        if (this._value === value)
            return;
        this._value = value;
        this.redraw();
    }

    set value(value) {
        this.value_no_fire = value;
        if (this.onvaluechange)
            this.onvaluechange({});
    }

    //-- peter
    set value2(value) {
        //this.value_no_fire = value;
        this._value = value;
        this.redraw();

        if (this.onvaluechange2)
            this.onvaluechange2({});

    }

    resize(preferred_width) {
        this.canvas.width = preferred_width ? preferred_width : $(this.outer).width();
        this.redraw();
    }

    event2point(e) {
        let rect = this.domNode.getBoundingClientRect();
        return {x: e.clientX - rect.left, y: e.clientY - rect.top};
    }

    redraw() {
        // clear the range control area
        let ctx = this.canvas.getContext('2d');

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // bar
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, this.canvas.height / 2);
        ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        ctx.strokeStyle = '#085e7d'; //--#f7f700
        ctx.stroke();

        let xx = this.value_2_pos(this._visible_max_value) + this.img.width / 2;
        /* --peter
        if (xx >= 0 && xx <= this.canvas.width) {
            ctx.strokeStyle = '#8f8f8f';
            ctx.beginPath();
            ctx.moveTo(xx, this.canvas.height / 2);
            ctx.lineTo(this.canvas.width, this.canvas.height / 2);
            ctx.stroke();
        }
*/
        //-- peter

        let prevVal = -1;
        let val;
        let tikPos = 0;
        let imgW2 = this.img.width / 2;

        ctx.beginPath();
        ctx.lineWidth = 1;

        for (let i = 0; i < this.canvas.width; i++)
        {
            val = Math.round(this.position_2_value(i));

            if(val != prevVal)
            {
                if(val % 10 == 0)
                {
                    ctx.moveTo(i + imgW2, this.canvas.height / 3 - 5);
                }
                else{
                    ctx.moveTo(i + imgW2, this.canvas.height / 3);
                }
                
                ctx.lineTo(i + imgW2, this.canvas.height / 2);

                if(val == this._tik)
                {
                    tikPos = i;
                }
            }

            prevVal = val;
        }

        ctx.stroke();


        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, this.canvas.height / 2 + 5);
        ctx.lineTo(tikPos + imgW2, this.canvas.height / 2 + 5);
        ctx.strokeStyle = '#37d538'; //--#f7f700
        ctx.stroke();


        //thumb

        let tr = this.thumb_rect;

        /*if (this.is_over) {
            ctx.fillStyle = 'rgba(100, 200, 0, 0.5)';
            ctx.fillRect(tr.x, tr.y, tr.w, tr.h);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ffe722';
            ctx.strokeRect(tr.x - 2, tr.y, tr.w + 4, tr.h);
        }*/

        ctx.globalAlpha = 0.6;
        ctx.drawImage(this.is_over ? this.hover_img : this.img, tr.x, tr.y);
        ctx.globalAlpha = 1;
    }

    value_2_pos(value) {
        let w = this.canvas.width - this.img.width;
        return w * (value - this.min_value) / (this.max_value - this.min_value);
    }

    get thumb_rect() {
        let xx = this.value_2_pos(this.value);
        return {
            x: xx,
            y: this.canvas.height / 2 - this.img.height / 2,
            w: this.img.width,
            h: this.img.height
        };
    }

    static point_in_thumb({x, y}, thumb_rect) {
        return x >= thumb_rect.x && x <= thumb_rect.x + thumb_rect.w && y >= thumb_rect.y && y <= thumb_rect.y + thumb_rect.h;
    }

    position_2_value(x) {
        x -= this.img.width / 2;
        let w = this.canvas.width - this.img.width;
        return x * (this.max_value - this.min_value) / w + this.min_value;
        //x = w * (this.value - this.min_value) / (this.max_value - this.min_value);
    }

    setup_waiting_mouse_up(on) {
        if (on)
            $(window)
                .on('mousemove', this.window_move)
                .on('mouseup', this.window_up);
        else
            $(window)
                .off('mousemove', this.window_move)
                .off('mouseup', this.window_up);
    }

    handleMouseDown(e) {
        if (e.button != 0)
            return;

        // tell the browser we're handling this event
        e.preventDefault();
        e.stopPropagation();
        // get mouse position
        let {x, y} = this.event2point(e);
        // test for possible start of dragging
        let tr = this.thumb_rect;

        if (Slider.point_in_thumb({x, y}, tr)) {
            this.dx = x - tr.x - this.img.width / 2;
        } else {
            this.value = this.position_2_value(x);
            this.dx = 0;
        }

        this.setup_waiting_mouse_up(true);
    }

    handleMouseMove(e) {
        this.is_over = Slider.point_in_thumb(this.event2point(e), this.thumb_rect);
        this.redraw();
    }
}
