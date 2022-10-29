import {LOCALIZATION} from "./localization"

export class Conveyor {

    static LOCALIZATION = LOCALIZATION;

    /**
     *
     * @param settings Объект с настройками задачи. В данный момент, внутри объекта settings ожидается только поле level,
     * которое может быть 0, 1 или 2.
     */
    constructor(settings) {
        this.level = settings.level;
    }

    parameters() {
        if (!this.message)
            this.message = function(s) {return s}
        let message = this.message;

        return [
            {
                name: 'd',
                title: message('Различных поворотов'),
                ordering: 'minimize'
            },
            {
                name: 'n',
                title: message('Длина программы'),
                ordering: 'minimize'
            }
        ];
    }
}