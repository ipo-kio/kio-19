import './woodenrailway.scss';
import {PinConstraint, VerletJS} from "./lib/verlet";
import Vec2 from "./lib/vec2";
import {Connection, RailwayBlock} from "./lib/railways";
import {RoundElement, SplitElement, StraightElement} from "./lib/elements";

export class Woodenrailway {

    /**
     *
     * @param settings Объект с настройками задачи. В данный момент, внутри объекта settings ожидается только поле level,
     * которое может быть 0, 1 или 2.
     */
    constructor(settings) {
        this.settings = settings;
    }

    /**
     * Идентификатор задачи, используется сейчас только как ключ для
     * хранения данных в localstorage
     * @returns {string} идентификатор задачи
     */
    id() {
        return 'woodenrailway' + this.settings.level;
    }

    /**
     *
     * @param domNode
     * @param kioapi
     * @param preferred_width
     */
    initialize(domNode, kioapi, preferred_width) {
        this.kioapi = kioapi;

        let tools = this.create_tools_div();
        let canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 500;
        canvas.style.display = 'inline-block';
        domNode.append(tools);
        domNode.append(canvas);

        this.ver = new VerletJS(canvas.width, canvas.height, canvas, this, ctx => {
            ctx.fillStyle = ctx.createPattern(this.kioapi.getResource('bg'), 'no-repeat');
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        this.ver.gravity = new Vec2(0, 0);
        let block = new RailwayBlock(kioapi);
        this.ver.composites.push(block);
        this.block = block;

        fill_elements(block);

        let loop = () => {
            this.ver.frame(16);
            this.ver.draw();
            requestAnimationFrame(loop);
        };

        loop();
    }

    parameters() {
        return [
            //TODO добавить список параметров
        ];
    }

    solution() {
        return this.ver.composites[0].serialize();
    }

    loadSolution(solution) {
        // Все объекты, которые сюда передаются, были ранее возвращены методом solution,
        // но проверять их все равно необходимо.
        this.ver.composites[0].deserialize(solution);
    }

    static preloadManifest() {
        return [
            {id: "bg", src: "woodenrailway-resources/bg.jpg"},
            {id: "wood", src: "woodenrailway-resources/wood.jpg"},
            {id: "nail", src: "woodenrailway-resources/nail.png"},
        ]; //TODO перечислить загружаемые ресурсы. Они находятся в каталоге taskid-resources
    }

    create_tools_div() {
        let tools = document.createElement('div');
        tools.style.display = 'inline-block';
        tools.style.padding = '1em';
        tools.style.verticalAlign = 'top';

        let all_tools = [];
        function create_tool(img, action) {
            let tool = document.createElement('button');
            tool.style.background = 'url(woodenrailway-resources/' + img + ') center no-repeat';
            tool.style.display = 'block';
            tool.style.width = '60px';
            tool.style.height = '60px';
            tool.style.margin = '0.6em 0';
            tool.className = 'tool-no-select';
            tool.addEventListener('click', e => {
                for (let t of all_tools)
                    t.className = 'tool-no-select';
                tool.className = 'tool-select';

                action(e);
            });
            tools.append(tool);

            all_tools.push(tool);
        }

        create_tool('nail.png', e => {
            this.selected_tool = 'move';
            console.log('click on move tool');
        });

        create_tool('nail.png', e => {
            this.selected_tool = 'nail';
            console.log('click on nail tool');
        });

        create_tool('nail.png', e => {
            this.selected_tool = 'straight';
            console.log('click on straight tool');
        });

        create_tool('nail.png', e => {
            this.selected_tool = 'round';
            console.log('click on round tool');
        });

        create_tool('nail.png', e => {
            this.selected_tool = 'split';
            console.log('click on split tool');
        });

        all_tools[0].className = 'tool-select';

        return tools;
    }
}

function fill_elements(block) {
    // let e1 = new StraightElement(block);

    let e2 = new RoundElement(block);
    let e3 = new RoundElement(block);
    let e4 = new RoundElement(block);
    let e5 = new RoundElement(block);
    let e6 = new RoundElement(block);
    let e7 = new RoundElement(block);
    let e8 = new RoundElement(block);
    let e9 = new RoundElement(block);

    // block.add_element(e1);
    block.add_element(e2);
    block.add_element(e3);
    block.add_element(e4);
    block.add_element(e5);
    block.add_element(e6);
    block.add_element(e7);
    block.add_element(e8);
    block.add_element(e9);
    // block.add_connecton(new Connection(e1.points[1], e2.points[0]));
    block.add_connecton(new Connection(e2.points[1], e3.points[0]));
    block.add_connecton(new Connection(e3.points[1], e4.points[0]));
    block.add_connecton(new Connection(e4.points[1], e5.points[0]));
    block.add_connecton(new Connection(e5.points[1], e6.points[0]));
    block.add_connecton(new Connection(e6.points[1], e7.points[0]));
    block.add_connecton(new Connection(e7.points[1], e8.points[0]));
    block.add_connecton(new Connection(e8.points[1], e9.points[0]));
    block.add_connecton(new Connection(e9.points[1], e2.points[0]));

    e9.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 0), 200 + 200 * Math.sin(2 * Math.PI / 8 * 0)));
    e8.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 1), 200 + 200 * Math.sin(2 * Math.PI / 8 * 1)));
    e7.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 2), 200 + 200 * Math.sin(2 * Math.PI / 8 * 2)));
    e6.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 3), 200 + 200 * Math.sin(2 * Math.PI / 8 * 3)));
    e5.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 4), 200 + 200 * Math.sin(2 * Math.PI / 8 * 4)));
    e4.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 5), 200 + 200 * Math.sin(2 * Math.PI / 8 * 5)));
    e3.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 6), 200 + 200 * Math.sin(2 * Math.PI / 8 * 6)));
    e2.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 7), 200 + 200 * Math.sin(2 * Math.PI / 8 * 7)));

    // block.constraints.push(new PinConstraint(e2.center_point, new Vec2(200, 200)));
    // block.constraints.push(new PinConstraint(e6.center_point, new Vec2(350, 200)));

    // ------------------------------------------------------------------------------------
    let ee2 = new RoundElement(block, true);
    let ee3 = new RoundElement(block, true);
    let ee4 = new RoundElement(block, true);
    let ee5 = new RoundElement(block, true);
    let ee6 = new RoundElement(block, true);
    let ee7 = new RoundElement(block, true);
    let ee8 = new RoundElement(block, true);
    let ee9 = new RoundElement(block, true);

    block.add_element(ee2);
    block.add_element(ee3);
    block.add_element(ee4);
    block.add_element(ee5);
    block.add_element(ee6);
    block.add_element(ee7);
    block.add_element(ee8);
    block.add_element(ee9);

    block.add_connecton(new Connection(ee2.points[1], ee3.points[0]));
    block.add_connecton(new Connection(ee3.points[1], ee4.points[0]));
    block.add_connecton(new Connection(ee4.points[1], ee5.points[0]));
    block.add_connecton(new Connection(ee5.points[1], ee6.points[0]));
    block.add_connecton(new Connection(ee6.points[1], ee7.points[0]));
    block.add_connecton(new Connection(ee7.points[1], ee8.points[0]));
    block.add_connecton(new Connection(ee8.points[1], ee9.points[0]));
    block.add_connecton(new Connection(ee9.points[1], ee2.points[0]));

    ee9.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 0), 200 + 200 * Math.sin(2 * Math.PI / 8 * 0)));
    ee8.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 1), 200 + 200 * Math.sin(2 * Math.PI / 8 * 1)));
    ee7.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 2), 200 + 200 * Math.sin(2 * Math.PI / 8 * 2)));
    ee6.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 3), 200 + 200 * Math.sin(2 * Math.PI / 8 * 3)));
    ee5.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 4), 200 + 200 * Math.sin(2 * Math.PI / 8 * 4)));
    ee4.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 5), 200 + 200 * Math.sin(2 * Math.PI / 8 * 5)));
    ee3.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 6), 200 + 200 * Math.sin(2 * Math.PI / 8 * 6)));
    ee2.move_to(new Vec2(300 + 200 * Math.cos(2 * Math.PI / 8 * 7), 200 + 200 * Math.sin(2 * Math.PI / 8 * 7)));

    let eee1 = new RoundElement(block, false);
    let eee2 = new RoundElement(block, true);
    let eee3 = new StraightElement(block);
    let eee4 = new SplitElement(block);
    let eee5 = new RoundElement(block, false);
    let eee6 = new RoundElement(block, true);

    block.add_element(eee1);
    block.add_element(eee2);
    block.add_element(eee3);
    block.add_element(eee4);
    block.add_element(eee5);
    block.add_element(eee6);
    block.add_connecton(new Connection(eee1.points[1], eee2.points[0]));
    block.add_connecton(new Connection(eee2.points[1], eee3.points[0]));
    block.add_connecton(new Connection(eee3.points[1], eee4.points[0]));
    block.add_connecton(new Connection(eee4.points[1], eee5.points[0]));
    block.add_connecton(new Connection(eee4.points[2], eee6.points[0]));
}
