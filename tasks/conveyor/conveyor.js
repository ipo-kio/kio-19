import './conveyor.scss';
import {Experiments} from "./experiments";
import {Belt, DIST_MOVE} from "./domain/belt";
import {Mouse} from "./mouse";
import {Slider} from "./slider";

export class Conveyor {

    time_goes = false;
    mouse;

    shift_x = 0;
    shift_y = 0;

    down_x = -1;
    down_y = -1;

    down_shift_x = -1;
    down_shift_y = -1;

    /**
     *
     * @param settings Объект с настройками задачи. В данный момент, внутри объекта settings ожидается только поле level,
     * которое может быть 0, 1 или 2.
     */
    constructor(settings) {
        this.level = settings.level;

        // console.log('--------');
        // // new Experiments(4, [1, 1, 2, 2]);
        // new Experiments([1, 1, 2, 3, 4, 5, 6, 7, 8, 9], true);
        // new Experiments([1, 1, 2, 3, 4, 5, 6, 7, 8, 9], false);
        //
        // new Experiments([1, 2, 1, 3, 1, 4, 1, 5, 1, 6], true);
        // new Experiments([1, 2, 1, 3, 1, 4, 1, 5, 1, 6], false);
        // new Experiments([1, 2, 1, 2, 1, 2, 1, 2, 1, 3], true);
        // new Experiments([1, 2, 1, 2, 1, 2, 1, 2, 1, 3], false);
        // new Experiments([1, 3, 3, 1, 2, 4, 1, 1], true);
        // new Experiments([1, 3, 3, 1, 2, 4, 1, 1], false);

        return;

        for (let i = 1; i <= 1; i++) {
            console.log('-----------------------------------');
            let rays = [1, 2, 3, 1, 2, 3, 1, 2];
            let t = 3;
            // for (let j = 0; j < 8; j++)
            //     rays.push(Math.floor(t * Math.random() + 1));

            let e1 = new Experiments(rays, false);
            let e2 = new Experiments(rays, true);

            console.log(e1.length, e2.length, rays);
        }
    }

    /**
     * Идентификатор задачи, используется сейчас только как ключ для
     * хранения данных в localstorage
     * @returns {string} идентификатор задачи
     */
    id() {
        return 'conveyor' + this.level;
    }

    /**
     *
     * @param domNode
     * @param kioapi
     * @param preferred_width
     */
    initialize(domNode, kioapi, preferred_width) {
        this.kioapi = kioapi;

        this.canvas = document.createElement('canvas');
        this.canvas.width = 900;
        this.canvas.height = this.level === 0 ? 620 / 4 * 3 : 620;
        this.canvas.className = 'kio-conveyor-canvas';
        this.ctx = this.canvas.getContext('2d');

        this.mouse = new Mouse();

        this.no_vertical_move = this.level <= 1;

        domNode.style.backgroundImage = `url(${kioapi.getResourceImageAsDataURL('bg')})`;

        this.canvas.onmousemove = e => {
            let rect = this.canvas.getBoundingClientRect();
            this.mouse._x = e.clientX - rect.left;
            this.mouse._y = e.clientY - rect.top;

            if (this.down_x >= 0) {
                let dx = this.mouse._x - this.down_x;
                let dy = this.mouse._y - this.down_y;

                this.shift_x = this.down_shift_x - dx;
                this.shift_y = this.down_shift_y + dy;
                this._update_shifts();
            }
        };

        let onmouseup = e => {
            let x = this.mouse.x;
            let y = this.mouse.y;

            let dist = Math.abs(this.down_x - x) + Math.abs(this.down_y - y);

            if (dist < 2) //click
                for (let b of this.belts)
                    b.mouse_click();

            this.down_x = -1;
            this.down_y = -1;

            document.removeEventListener('mouseup', onmouseup)
        };

        this.canvas.onmousedown = e => {
            this.down_x = this.mouse._x;
            this.down_y = this.mouse._y;
            this.down_shift_x = this.shift_x;
            this.down_shift_y = this.shift_y;

            document.addEventListener('mouseup', onmouseup);
        };

        domNode.append(this.canvas);
        this._init_time_controls(domNode, preferred_width);

        this.n = 6 + this.level * 2;
        this._init_belts();

        let current_time = new Date().getTime();

        let loop = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            requestAnimationFrame(loop);

            let now = new Date().getTime();
            let elapsed_time = now - current_time;
            current_time = now;

            for (let belt of this.belts) {
                if (this.time_goes) {
                    belt.time += elapsed_time / 1000;
                    if (belt.time >= this._slider.max_value)
                        this._stop_play();
                    this._slider.value_no_fire = belt.time;
                }
                belt.draw(this.ctx);
            }
        };

        loop();
    }

    _init_time_controls(domNode, preferred_width) {
        let time_controls_container = document.createElement('div');
        time_controls_container.className = 'time-controls-container';
        domNode.appendChild(time_controls_container);

        this._slider = new Slider(time_controls_container, 0, 100, 35/*fly1 height*/, this.kioapi.getResource('slider'), this.kioapi.getResource('slider-hover'), this.kioapi.getResource('slider-line'));
        this._slider.domNode.className = 'conveyor-slider';
        this._slider.resize(preferred_width - 16);
        time_controls_container.appendChild(this._slider.domNode);

        function add_button(title, id, action) {
            let button = document.createElement('button');
            button.id = id;
            button.innerHTML = title;
            $(button).click(action);
            time_controls_container.appendChild(button);
        }

        this._start_play = () => {
            this.time_goes = true;
            $('#slider-control-play').text('Остановить');
        };

        this._stop_play = () => {
            this.time_goes = false;
            $('#slider-control-play').text('Запустить');
        };

        add_button('В начало', 'slider-control-0', () => this._slider.value = 0);
        add_button('-1', 'slider-control-p1', () => this._slider.value--);
        add_button('+1', 'slider-control-m1', () => this._slider.value++);
        add_button('В конец', 'slider-control-max', () => this._slider.value = this._slider.max_value);
        add_button('Запустить', 'slider-control-play', () => {
            if (!this.time_goes)
                this._start_play();
            else
                this._stop_play();
        });

        this._time_shower = document.createElement('span');
        this._time_shower.className = 'conveyor-time-shower';
        time_controls_container.appendChild(this._time_shower);

        this._slider.onvaluechange = () => {
            for (let belt of this.belts) {
                belt.time = this._slider.value;
                belt.draw(this.ctx);
            }
        };
    }

    _init_belts() {
        this.belts = new Array(this.n);
        let initial_rays = [1, 2, 3, 1, 1, 2, 1, 1, 1, 1];

        let program_change_handler = new_program => {
            for (let b of this.belts)
                b.program = new_program;
            this._slider.update_max_value(this.belts[0].max_time());
        };

        for (let i = 0; i < this.n; i++) {
            let j = 2 * i < this.n ? 0 : 1;
            let belt = new Belt(initial_rays, 62 + j * 460, 96 + (i % (this.n / 2)) * 156, 430, this.mouse, this.kioapi, program_change_handler, i + 1);
            belt.program = [1, 2, 3, 3, 2, 1, 1];
            belt.shift_x = 0;

            let first_ray = initial_rays[0];
            initial_rays = initial_rays.slice(1);
            initial_rays.push(first_ray);

            this.belts[i] = belt;
        }

        this._slider.update_max_value(this.belts[0].max_time());
    }

    _update_shifts() {

        if (this.no_vertical_move)
            this.shift_y = 0;
        else {
            if (this.shift_y < -160)
                this.shift_y = -160;
            if (this.shift_y > 0)
                this.shift_y = 0;
        }

        if (this.shift_x < -60)
            this.shift_x = -60;
        let width0 = this.belts[0]._program.length * DIST_MOVE;
        if (this.shift_x > width0)
            this.shift_x = width0;

        for (let b of this.belts) {
            b.shift_x = this.shift_x;
            b.shift_y = this.shift_y;
        }
    }

    static preloadManifest() {
        return [
            {id: "bg", src: "conveyor-resources/bg.png"},
            {id: "detail", src: "conveyor-resources/detail.png"},

            {id: "stick-left", src: "conveyor-resources/stick-left.png"},

            {id: "belt", src: "conveyor-resources/belt.png"},
            {id: "belt-left", src: "conveyor-resources/belt-left.png"},
            {id: "belt-right", src: "conveyor-resources/belt-right.png"},

            {id: "slider", src: "conveyor-resources/slider.png"},
            {id: "slider-hover", src: "conveyor-resources/slider-hover.png"},
            {id: "slider-line", src: "conveyor-resources/slider-line.png"}
        ];
    }

    parameters() {
        return [
            //TODO добавить список параметров
        ];
    }

    solution() {
        //TODO вернуть объект с описанием решения участника
    }

    loadSolution(solution) {
        // Все объекты, которые сюда передаются, были ранее возвращены методом solution,
        // но проверять их все равно необходимо.
        //TODO загрузить объект с решением участника.
    }
}