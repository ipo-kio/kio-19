import './trafficlights.scss'
import './slider.scss'
import { Helper } from './Classes/Helper.js'
import { SettingsHelper } from './Classes/SettingsHelper.js'
import { Road } from './Classes/Road.js'
import { Cross } from './Classes/Cross.js'
import { TrackNode } from './Classes/TrackNode.js'
import { Result } from './Classes/Result.js'
import { Sveto } from './Classes/Sveto.js'
import { Solution } from './Classes/Solution.js'
import { SvetoHelper } from './Classes/SvetoHelper.js'
import { Slider } from './Classes/slider.js'
import { LOCALIZATION } from "./localization";

var _thisProblem

export class Trafficlights {
    static LOCALIZATION = LOCALIZATION

  _currentSolution
  _levelSettings
  CANVAS_DOP_W = 110
  CANVAS_DOP_H = 0
  BGCOLOR_KARTA = 'gray'
  _stageBottom
  _stageTop
  _crossDic = {}
  _blocksMap = {}
  _roadSelectedDic = {}
  _roadDic = {}
  _ggg = 0
  _finishCrossId
  _crossDic = {}
  _svetoDic = {}
  _selectedCrossId = ''
  _infoBoxConteiner
  _trackRoadCrossDic = {}
  _pointsDic = {}
  _pointsExclDic = {}
  _canvasGo
  _stageGo
  _fullTrackRoadIds = []
  _firstTrackRoadId = ''
  _startCrossId
  _startRoadIdV
  _startRoadIdH
  _startRoadIdV2
  _startRoadIdH2
  _tikDiv
  _slider
  _preferred_width
  _crossShapeDic = {}
  _globalTik = 0
  _prevSliderVal = 0
  _delClickCount = 0
  _lastClickRoadId = ''
  _varCount = 0
  _isTrackFull = false
  _fullTrackDic = {}
  _currentResult = new Result()
  _lastTrackRoadId = ''
  _trackPointsDic = {};
  /**
   *
   * @param settings Объект с настройками задачи. В данный момент, внутри объекта settings ожидается только поле level,
   * которое может быть 0, 1 или 2.
   */
  constructor (settings) {
    var i, j
    this.settings = settings
    let sveto


    // console.log('this.settings=');
    // console.log(this.settings);

    this._currentSolution = new Solution()
    this._currentSolution._level = settings.level

    SettingsHelper.setSettings(this.settings)

    this._levelSettings = this.settings.levels[settings.level]

    this._levelSettings.roadCountX = Helper.getParamIntDef(
      this.settings.roadCountX,
      this._levelSettings.roadCountX
    )
    this._levelSettings.roadCountY = Helper.getParamIntDef(
      this.settings.roadCountY,
      this._levelSettings.roadCountY
    )
    this._levelSettings.roadWidth = Helper.getParamIntDef(
      this.settings.roadWidth,
      this._levelSettings.roadWidth
    )
    this._levelSettings.roadLen = Helper.getParamIntDef(
      this.settings.roadLen,
      this._levelSettings.roadLen
    )

    this._levelSettings.startCrossId = Helper.getParamIntDefStr(
      this.settings.startCrossId,
      this._levelSettings.startCrossId
    )
    this._levelSettings.finishCrossId = Helper.getParamIntDefStr(
      this.settings.finishCrossId,
      this._levelSettings.finishCrossId
    )

    if (this.settings.blocks) {
      this._levelSettings.blocks = []
      let ss = this.settings.blocks.split(/,| /)

      for (i = 0; i < ss.length; i++) {
        this._levelSettings.blocks.push(ss[i])
      }
    }

    if (this.settings.points) {
      this._levelSettings.points = []

      let ss = this.settings.points.split(/,| /)

      for (i = 0; i < ss.length; i++) {
        this._levelSettings.points.push(ss[i])
      }
    }

    if (this.settings.svets) {
      let crossId, sv, pr
      this._levelSettings.svets = {}

      /*
            2:2=L-RTB,R-TBL;T-LRB;B-LRT
            2:3=L-RTB,R-TBL;T-LRB;B-LRT
            */

      let ss = this.settings.svets.split('\n')
      let ss1, ss2

      for (i = 0; i < ss.length; i++) {
        ss1 = ss[i].split('=')
        if (ss1.length == 2) {
          crossId = ss1[0].trim()

          if (!this._levelSettings.svets.hasOwnProperty(crossId)) {
            sv = new Object()
            sv._programma = []
            ss2 = ss1[1].split(';')

            for (j = 0; j < ss2.length; j++) {
              if (ss2[j] != '') {
                sv._programma.push(ss2[j].replace(',', ';'))
              }
            }

            if (sv._programma.length > 0) {
              this._levelSettings.svets[crossId] = sv._programma
            }
          }
        }
      }
    }

    for (i = 0; i < this._levelSettings.blocks.length; i++) {
      if (!this._blocksMap.hasOwnProperty(this._levelSettings.blocks[i])) {
        this._blocksMap[this._levelSettings.blocks[i]] = 1
      }
    }

    for (i = 0; i < this._levelSettings.points.length; i++) {
      if (!this._pointsExclDic.hasOwnProperty(this._levelSettings.points[i])) {
        this._pointsExclDic[this._levelSettings.points[i]] = 1
      }
    }

    for (var crossId1 in this._levelSettings.svets) {
      // if(!this._pointsDic.hasOwnProperty(crossId1))
      {
        if (
          !this._svetoDic.hasOwnProperty(this._levelSettings.svets[crossId1])
        ) {
          sveto = new Sveto()
          sveto._crossId = crossId1
          sveto._programma = this._levelSettings.svets[crossId1]

          this._svetoDic[sveto._crossId] = sveto
        }
      }
    }

    this._finishCrossId = this._levelSettings.finishCrossId
    this._startCrossId = this._levelSettings.startCrossId

    // console.log(this._levelSettings);
    // console.log(this._svetoDic);
  }

  /**
   * Идентификатор задачи, используется сейчас только как ключ для
   * хранения данных в localstorage
   * @returns {string} идентификатор задачи
   */
  id () {
    return 'trafficlights' + this.settings.level // TODO заменить task-id на реальный id задачи
  }

  /**
   *
   * @param domNode
   * @param kioapi
   * @param preferred_width
   */
  initialize (domNode, kioapi, preferred_width) {
    this.kioapi = kioapi

    // TODO реализовать инициализацию
    this.initInterface(domNode, preferred_width)
  }

  static preloadManifest () {
    //console.log('preloadManifest()')
    return [
        { id: 'slider_p', src: 'trafficlights-resources/slider_p.png' },
        { id: 'start', src: 'trafficlights-resources/start.png' },
        { id: 'cross', src: 'trafficlights-resources/cross.png' },
        { id: 'background', src: 'trafficlights-resources/background.png' },
        { id: 'a_0', src: 'trafficlights-resources/a_0.png' },
        { id: 'a_1', src: 'trafficlights-resources/a_1.png' },
        { id: 'a_2', src: 'trafficlights-resources/a_2.png' },
        { id: 'a_3', src: 'trafficlights-resources/a_3.png' },
        { id: 'a_4', src: 'trafficlights-resources/a_4.png' },
        { id: 'a_5', src: 'trafficlights-resources/a_5.png' },
        { id: 'a_6', src: 'trafficlights-resources/a_6.png' },
        { id: 'a_7', src: 'trafficlights-resources/a_7.png' },
        { id: 'point_0', src: 'trafficlights-resources/point_0.png' },
        { id: 'point_1', src: 'trafficlights-resources/point_1.png' },
        { id: 'road_h', src: 'trafficlights-resources/road_h.png' },
        { id: 'road_v', src: 'trafficlights-resources/road_v.png' },
        { id: 'car', src: 'trafficlights-resources/car.png' }
    ] // TODO перечислить загружаемые ресурсы. Они находятся в каталоге taskid-resources
  }

  parameters () {
    // console.log('parameters()');
    /*
        return [
            //TODO добавить список параметров
        ];
        */
      if (!this.message)
          this.message = s => s;
      let message = this.message
    
      let _isTrackFull = {
        name: '_isTrackFull',
        title: message('Маршрут закончен:'),
        ordering: 'maximize',
        view: function (ok) {
          if (ok) {
            return message('ДА!')
          } else {
            return message('Нет')
          }
        }
      }
      let _pointCount = {
        name: '_pointCount',
        title: message('Пройдено достопримечательностей:'),
        ordering: 'maximize'
      }
      let _roadCount = {
        name: '_roadCount',
        title: message('Пройденный путь:'),
        ordering: 'minimize'
      }

      let _tikCount = {
        name: '_tikCount',
        title: message('Время в пути:'),
        ordering: 'minimize'
      }

      if(this._currentSolution._level == 2)
      {
          return[_isTrackFull, _pointCount, _tikCount, _roadCount];
      }
      else  if(this._currentSolution._level == 1)
      {
          return[_isTrackFull, _pointCount, _roadCount, _tikCount];
      }
      else
      {
        return[_pointCount, _roadCount, _tikCount];
      }
    
  }

  solution () {
    // TODO вернуть объект с описанием решения участника
    // console.log('solution()');

    return JSON.stringify(this._currentSolution)
  }

  loadSolution (solution) {
    // Все объекты, которые сюда передаются, были ранее возвращены методом solution,
    // но проверять их все равно необходимо.
    // TODO загрузить объект с решением участника.

    // console.log('loadSolution()... ');

    let loadOK = false
    let sol

    if (solution !== undefined) {
      sol = JSON.parse(solution)

      loadOK = true
    } else {
      /*
            let solStr = localStorage.getItem(this.id() + '_current');

            if(solStr != null)
            {
                sol = JSON.parse(solStr);

                loadOK = true;
            }
            */
    }

    if (loadOK && sol != null) {
      this._firstTrackRoadId = sol._firstTrackRoadId

      this.prepareAll()
      this._roadSelectedDic = sol._roadSelectedDic
      this._trackRoadCrossDic = sol._trackRoadCrossDic

      this.updateTracks(true)

      this.saveCurrentSolution()
    }
  }

  initInterface (domNode, preferred_width) {
    console.log('initInterface()')
    _thisProblem = this
    this._preferred_width = preferred_width
    let roadWidth = this._levelSettings.roadWidth
    let roadLen = this._levelSettings.roadLen
    let div

    let w =
      20 +
      (this._levelSettings.roadCountX - 1) * roadLen +
      this._levelSettings.roadCountX * roadWidth +
      this.CANVAS_DOP_W;
    let h =
      20 +
      this._levelSettings.roadCountY * roadLen +
      (this._levelSettings.roadCountY + 1) * roadWidth +
      this.CANVAS_DOP_H // 400;

    let canvasContDiv = document.createElement('div')
    canvasContDiv.innerHTML = ''
    canvasContDiv.id = 'canvasContDiv'
    canvasContDiv.className = 'canvas_cont_div'
    canvasContDiv.style.width = w + 'px'
    canvasContDiv.style.height = h + 'px'
    domNode.appendChild(canvasContDiv)

    this._canvasBottom = document.createElement('canvas')
    this._canvasBottom.width = w
    this._canvasBottom.height = h
    this._canvasBottom.className = 'canvas_bottom'
    canvasContDiv.appendChild(this._canvasBottom)

    this._canvasTop = document.createElement('canvas')
    this._canvasTop.width = w
    this._canvasTop.height = h
    this._canvasTop.className = 'canvas_top'
    canvasContDiv.appendChild(this._canvasTop)

    this._canvasGo = document.createElement('canvas')
    this._canvasGo.width = w
    this._canvasGo.height = h
    this._canvasGo.className = 'canvas_go'
    canvasContDiv.appendChild(this._canvasGo)

    let controlDiv = document.createElement('div')
    controlDiv.innerHTML = ''
    controlDiv.id = 'control_div'
    controlDiv.className = 'control_div'
    domNode.appendChild(controlDiv)

    let btn

    btn = document.createElement('button')
    btn.innerHTML = '&#171;' // <<
    btn.id = 'go_btn1'
    btn.title = this.message('В начало')
    btn.className = 'go_btn1'
    btn.addEventListener('click', function (evt) {
      _thisProblem.goToStart()
    })
    controlDiv.appendChild(btn)

    btn = document.createElement('button')
    btn.innerHTML = '&#8250;' // >
    btn.title = this.message('Поехали')
    btn.id = 'go_btn_continue'
    btn.className = 'go_btn1'
    btn.addEventListener('click', function (evt) {
      _thisProblem.go()
    })
    controlDiv.appendChild(btn)

    btn = document.createElement('button')
    btn.innerHTML = '&#108;&#108;' // -- ||&#8214;
    btn.id = 'go_btn_pause'
    btn.title = this.message('Пауза')
    btn.style.fontSize = '16px'
    btn.style.paddingTop = '5px'
    btn.className = 'go_btn1'
    btn.addEventListener('click', function (evt) {
      _thisProblem.goPause()
    })
    controlDiv.appendChild(btn)

    btn = document.createElement('button')
    btn.innerHTML = '&#187;' // >>
    btn.id = 'go_btn4'
    btn.title = this.message('В конец')
    btn.className = 'go_btn1'
    btn.addEventListener('click', function (evt) {
      _thisProblem.goToEnd()
    })
    controlDiv.appendChild(btn)

    btn = document.createElement('button')
    btn.innerHTML = '&#8722;'; //'&#8678;'
    btn.id = 'go_btn_plus'
    btn.title = this.message('Шаг назад')
    btn.className = 'go_btn1'
    btn.style.marginLeft = '20px'
    btn.addEventListener('click', function (evt) {
      _thisProblem.goStepPlus(false)
    })
    controlDiv.appendChild(btn)

    this._tikDiv = document.createElement('span')
    this._tikDiv.innerHTML = '0'
    this._tikDiv.id = 'tik_div'
    this._tikDiv.className = 'tik_div'
    controlDiv.appendChild(this._tikDiv)

    btn = document.createElement('button')
    btn.innerHTML = '&#43;';//'&#8680;'
    btn.id = 'go_btn_plus'
    btn.title = this.message('Шаг вперед')
    btn.className = 'go_btn1'
    btn.addEventListener('click', function (evt) {
      _thisProblem.goStepPlus(true)
    })
    controlDiv.appendChild(btn)

    this._slider = new Slider(
      controlDiv,
      0,
      100,
      45,
      this.kioapi.getResource('slider_p'),
      this.kioapi.getResource('slider_p')
    )
    this._slider.domNode.className = 'hexagons-slider'
    this._slider.resize(preferred_width - 16)
    this._slider.max_value = 100
    controlDiv.appendChild(this._slider.domNode)

    this._slider.onvaluechange = function () {
      // -- тащим руками
      if (_thisProblem._prevSliderVal != _thisProblem._slider.value) {
        _thisProblem._globalTik = _thisProblem._slider.value
        // console.log('val=' + _thisProblem._slider.value);
        _thisProblem._goSliderNoValue2 = true
        _thisProblem.goToTikClick(_thisProblem._slider.value)
        _thisProblem.goShowTik(_thisProblem._slider.value)

        _thisProblem._prevSliderVal = _thisProblem._slider.value
      }
    }

    this._slider.onvaluechange2 = function () {
      // -- изменяем программно
      // console.log('val2=' + Math.round(_thisProblem._slider.value));
      _thisProblem.goShowTik(Math.round(_thisProblem._slider.value))
    }

    this.start()
  }

  start () {
    this.prepareAll()
    this.updateAll()
    this.saveCurrentSolution()
  }

  _goShape
  _goStopFlag = true
  _goTT
  _goPrevRoadId = ''
  _goCurrentTik
  _goWaitCount
  _goStepIndex = 0
  _goLastDirect = 'R'
  _goTik = -1
  _goSvetsArr = []
  _goSliderNoValue2 = false
  _goArr = []
  _carW;

  goShowTik (newTik) {
    this._tikDiv.innerHTML = this._globalTik //  newTik;
  }

  go () {
    console.log('go()')
    _thisProblem.goContinue()
  }

  goContinue () {
    this._goSliderNoValue2 = false
    this._goStopFlag = false

    this.goSetButtons()

    if (this._goArr.length == 0) {
      this.goNextStart(0)
    } else {
      this.goNext2()
    }
  }

  goToStart () {
    this.goStop()
    this._goSliderNoValue2 = false
    this._slider.value2 = 0
    this._globalTik = 0
    this.sliderSetValue()
    this._goStepIndex = 0
    this._goShape.x = -100
    this._goShape.y = -100

    this.drawSveto()
    this._stageTop.update()
  }

  goPause () {
    this._goStopFlag = true
    this.goSetButtons()
  }

  goStop () {
    this._goStopFlag = true
    this.goSetButtons()
  }

  goSetButtons () {
    if (this._goStopFlag) {
      document.getElementById('go_btn_continue').disabled = false
      document.getElementById('go_btn_pause').disabled = true
    } else {
      document.getElementById('go_btn_continue').disabled = true
      document.getElementById('go_btn_pause').disabled = false
    }
  }

  goNextStart (startTik) {
    this.goCreate()
    // console.log('goNextStart()  this._goLastDirect=' + this._goLastDirect + ' startTik = ' + startTik);

    this._goSliderNoValue2 = false
    this.goToTik(startTik)

    this.goNext2()
  }

  goStepPlus (plusminus) {
    let tik = this._slider.value

    if (plusminus) {
      tik++
    } else {
      tik--
    }

    if (tik < 0) {
      tik = 0
      this.goToStart()
      return
    }

    this._globalTik = tik

    if (this._globalTik > this._currentResult._tikCount) {
      this.sliderSetValue() 
      this.drawSveto()  
      this.updateTop()
    } else {
      this.goSetTik(this._globalTik)
    }
    this.updateTracks();
  }

  goCreate () {
    // console.log('go create()');

    this._goStopFlag = false
    this._goRoadIndex = 0
    this._goTT = 0
    this._goCurrentTik = 1
    this._goWaitCount = 0
    this._goStepIndex = 0
    this._goTik = -1
    this._goShape.x = 100
    this._goShape.y = 100

    this._goArr = []
    this._goSvetsArr = []
    let i, j, k, n
    let pr, rg
    let roadId
    let trackNode
    let roadShape
    let goSveto
    let goStep, sveto, svShape, crossShape
    let goStepW
    let svetoSide
    let roadWidth = this._levelSettings.roadWidth
    let roadLen = this._levelSettings.roadLen
    let svetoCross, cross1

    let len = roadLen + roadWidth - 10
    let nextTik = -1
    let ttD = Math.round(len / 3) // -- количество шажков, за которое проедем участок
    let tt = Math.round(len / ttD) // -- количество точек в одном шажке
    let direct
    let svetInTracDic = {}

    let prevx = 0

    for (i = 0; i < this._fullTrackRoadIds.length; i++) 
    {
      // sveto = this._svetoDic[srossIdKey];
      // trackNode = this.getTrackNodeByCrossId2(sveto._crossId);

      roadId = this._fullTrackRoadIds[i]
      trackNode = this._fullTrackDic[roadId]
      roadShape = this._stageTop.getChildByName('road_' + roadId)

      nextTik = nextTik + 1
      direct = trackNode._direct



      for (j = 0; j < ttD; j++) {
        goStep = new Object()
        goStep._tik = nextTik // trackNode._fullTikCount;
        goStep._waitCount = 0
        goStep._direct = direct
        goStep._tik = nextTik

        this._goArr.push(goStep)

        if (direct == 'R') 
        {
          goStep.x = roadShape.x + tt * j - roadWidth / 2 - this._carW
          goStep.y = roadShape.y + (roadWidth / 2 - this._carW / 2 + 2)
        } 
        else if (direct == 'L') {
          goStep.x = roadShape.x + roadLen - tt * j + roadWidth
          goStep.y = roadShape.y + (roadWidth - this._carW / 2) - 2
        } 
        else if (direct == 'T') 
        {
          goStep.x = roadShape.x + (roadWidth / 2 + this._carW / 2 - 2 - 10)
          goStep.y = roadShape.y + roadLen - tt * j + this._carW / 2 + 15
        } else if (direct == 'B') {
          goStep.x = roadShape.x + roadWidth / 2 - 5
          goStep.y = roadShape.y + tt * j - roadWidth / 2
        }

        if (j == Math.round(ttD - 5)) 
        {
          // -- предпоследний такт (почти)

          let nextNode = this.getNextTrackNode(trackNode._road._id)

          if (nextNode != null) 
          {
            goStep._waitTik = 0

            if (nextNode._thisTikCount > 1) {
              nextTik = nextTik + nextNode._thisTikCount - 1

              n = ttD * (nextNode._thisTikCount - 1)

              if (nextNode._thisTikCount == 3) {
                for (k = 0; k < n; k++) {
                  goStepW = new Object()
                  goStepW._tik = nextTik - 1
                  goStepW._waitCount = 1
                  goStepW._waitTik = 1
                  goStepW._direct = direct
                  goStepW.x = goStep.x
                  goStepW.y = goStep.y

                  this._goArr.push(goStepW)
                }
              }
              // console.log('gggggg nextNode._thisTikCount=' + nextNode._thisTikCount)

              for (k = 0; k < n; k++) {
                goStepW = new Object()
                goStepW._tik = nextTik
                goStepW._waitCount = 1
                goStepW._waitTik = 1
                goStepW._direct = direct
                goStepW.x = goStep.x
                goStepW.y = goStep.y

                this._goArr.push(goStepW)
              }
            }

            

            if(direct != nextNode._direct)
            {
              //j = j + 5
            }

          } else {
            goStep._waitTik = 0
          }



        } else {
          goStep._waitTik = 0
        }

        

        if (j > ttD - 5) {
          goStep._tik = goStep._tik + 1
        }

        //this._goArr.push(goStep)
      }
    }

    //console.log(this._goArr);
    // console.log(this._goSvetsArr);

    this._goStepIndex = ttD - 10

    if (this._goStepIndex < 0) {
      this._goStepIndex = 0
    }
  }

  goNextStep () {
    _thisProblem.goNext2()
  }

  goNext2 () {
    // console.log('goNext2() this._goStepIndex=' + this._goStepIndex + ' this._goArr.length=' + this._goArr.length)
    if (!this._goStopFlag) 
    {
      let i

      //let roadWidth = this._levelSettings.roadWidth
      //let r = roadWidth / 8
      //let x = roadWidth / 2

      if (this._goStepIndex < this._goArr.length) 
      {
        let goStep = this._goArr[this._goStepIndex]

        // -- мигаем светофором

        if (goStep._tik != this._goTik) {
          this._globalTik = goStep._tik
          this.drawSveto()

          this.sliderSetValue()

          this._goTik = goStep._tik
        }

        // if(goStep._waitCount  == 0)
        {
          if (goStep._direct != this._goLastDirect) {
            if (this._goLastDirect == 'R') {
              if (goStep._direct == 'T') {
                this._goShape.rotation = -90
              } else if (goStep._direct == 'B') {
                this._goShape.rotation = -90
              }
            } else if (this._goLastDirect == 'T') {
              if (goStep._direct == 'R') {
                this._goShape.rotation = 0
              } else if (goStep._direct == 'L') {
                this._goShape.rotation = 180
              }
            } else if (this._goLastDirect == 'L') {
              if (goStep._direct == 'R') {
                this._goShape.rotation = 0
              }
              if (goStep._direct == 'B') {
                this._goShape.rotation = -90
              }
              if (goStep._direct == 'T') {
                this._goShape.rotation = -90
              }
            } else if (this._goLastDirect == 'B') {
              if (goStep._direct == 'R') {
                this._goShape.rotation = 0
              }
              if (goStep._direct == 'T') {
                this._goShape.rotation = 90
              }
              if (goStep._direct == 'L') {
                this._goShape.rotation = 180
                goStep.y = goStep.y
              }
            }

            this._goLastDirect = goStep._direct
          }

          this._goShape.x = goStep.x;
          this._goShape.y = goStep.y;
        }

        this._stageTop.update()

        this._goStepIndex++

        let t = 40

        setTimeout(_thisProblem.goNextStep, t)
      } else {
        // console.log('go stop2 this._goLastDirect=' + this._goLastDirect);
        this._goStopFlag = true
      }
    }
  }

  goToTikClick (tik) {
    this.goSetTik(tik)
  }

  goSetTik (tik) {
    this.goStop()
    this._globalTik = tik
    this.sliderSetValue()
    this.goToTik(tik)
    // console.log('goSetTik() tik=' + tik + ' this._goStepIndex=' + this._goStepIndex);
    this._goStopFlag = false
    this.goNext2()
    this.goPause()

    this.drawSveto()
  }

  sliderSetValue () {
    this._slider.value2 = this._globalTik
  }

  goToTik (tik) {
    // console.log('goToTik() tik =' + tik);
    let i, goStep

    if (this._goArr.length == 0) {
      this.goCreate()
    }

    if (tik == 0) {
      this._goStepIndex = 0
    } else {
      for (i = 0; i < this._goArr.length; i++) {
        goStep = this._goArr[i]

        if (goStep._tik == tik) {
          this._goStepIndex = i
          return
        }
      }

      if (this._goArr.length > 0) {
        this._goStepIndex = this._goArr.length - 1
      } else {
        this._goStepIndex = 0
      }
    }
  }

  goToEnd () {
    if (this._goArr.length == 0) {
      this.goCreate()
    }

    this.goSetTik(this._currentResult._tikCount)
  }

  

  addPoint (crossId) {
    if (!this._pointsExclDic.hasOwnProperty(crossId)) {
      this._pointsDic[crossId] = 1
    }
  }

  prepareAll () {
    // console.log('prepareAll() ggg=');
    this._stageBottom = new createjs.Stage(this._canvasBottom)
    this._stageBottom.enableMouseOver()
    // this._stageBottom.clear;
    this._stageTop = new createjs.Stage(this._canvasTop)
    this._stageTop.enableMouseOver()
    // this._stageTop.clear;
    this._stageTop.nextStage = this._stageBottom

    this._stageGo = new createjs.Stage(this._canvasGo)
    let i;
    let X, Y
    let crossId, crossIdNext, x, y, roadId

    let roadCountX = this._levelSettings.roadCountX
    let roadCountY = this._levelSettings.roadCountY
    let roadWidth = this._levelSettings.roadWidth
    let roadLen = this._levelSettings.roadLen

    // -- Подкладка под карту

    let backGroundShape = new createjs.Shape()
    backGroundShape.graphics.beginFill(this.BGCOLOR_KARTA)

    let img = this.kioapi.getResource('background');
    backGroundShape.graphics.beginBitmapFill(img, "repeat");

    backGroundShape.graphics.drawRect(
      10,
      10,
      roadLen * (roadCountX - 1) + (roadWidth * (roadCountX - 1) + roadWidth),
      roadLen * roadCountY + roadWidth * roadCountY + roadWidth
    )
    //backGroundShape.graphics.endFill()

    this._stageBottom.addChild(backGroundShape)

    // -- светофоры

    let svetoCont
    let cross
    let crossShape

    // -- дороги

    let roadForCreate
    let roadForCreateArr = []

    for (x = 0; x < roadCountX; x++) {
      for (y = 0; y < roadCountY; y++) {
        // ---------------------вертикальные-----------------------------------

        crossId = x + ':' + (roadCountY - y)
        cross = new Cross(crossId, x, y)
        this._crossDic[crossId] = cross

        this.addPoint(crossId)

        crossIdNext = x + ':' + (roadCountY - y - 1)

        if (!this._crossDic.hasOwnProperty(crossIdNext)) {
          cross = new Cross(crossIdNext, x, y + 1)
          this._crossDic[crossIdNext] = cross

          this.addPoint(crossIdNext)
        }

        X = x
        Y = roadCountY - y - 1
        roadId = X + 'V' + Y

        roadForCreate = new Object()
        roadForCreate.vh = 'v'
        roadForCreate.roadId = roadId
        roadForCreate.crossId = crossId
        roadForCreate.crossIdNext = crossIdNext
        roadForCreate.x = x
        roadForCreate.y = y
        roadForCreate.X = X
        roadForCreate.Y = Y
        roadForCreateArr.push(roadForCreate)

        // this.createRoad('v', roadId, crossId, crossIdNext, x, y);
      }
    }

    for (x = 0; x < roadCountX - 1; x++) {
      for (y = 0; y < roadCountY + 1; y++) {
        // ------------------------горизонтальные-------------------
        crossId = x + ':' + (roadCountY - y)
        crossIdNext = x + 1 + ':' + (roadCountY - y)

        X = x
        Y = roadCountY - y

        roadId = X + 'H' + Y

        roadForCreate = new Object()
        roadForCreate.vh = 'h'
        roadForCreate.roadId = roadId
        roadForCreate.crossId = crossId
        roadForCreate.crossIdNext = crossIdNext
        roadForCreate.x = x
        roadForCreate.y = y
        roadForCreate.X = X
        roadForCreate.Y = Y
        roadForCreateArr.push(roadForCreate)

        // this.createRoad('h', roadId, crossId, crossIdNext, x, y);
      }
    }

    // -- перекрестки светофоры и поинты

    cross = this.getCrossById(this._startCrossId)

    this._startRoadIdH = cross.x + 'H' + (roadCountY - cross.y)
    this._startRoadIdV = cross.x + 'V' + (roadCountY - cross.y)

    if (cross.x > 0) {
      this._startRoadIdH2 = cross.x - 1 + 'H' + (roadCountY - cross.y)
    } else {
      this._startRoadIdH2 = ''
    }

    if (cross.y < roadCountY) {
      this._startRoadIdV2 = cross.x + 'V' + (roadCountY - cross.y - 1)
    } else {
      this._startRoadIdV2 = ''
    }

    if (this._svetoDic.hasOwnProperty(this._startCrossId)) {
      delete this._svetoDic[this._startCrossId]
    }

    if (this._svetoDic.hasOwnProperty(this._finishCrossId)) {
      delete this._svetoDic[this._finishCrossId]
    }

    if (this._pointsDic.hasOwnProperty(this._startCrossId)) {
      delete this._pointsDic[this._startCrossId]
    }

    if (this._pointsDic.hasOwnProperty(this._finishCrossId)) {
      delete this._pointsDic[this._finishCrossId]
    }

    let svetoShape, pointShape
    let hit
    let sveto, point
    let n, s;
    let r = roadWidth / 8
    x = roadWidth / 2
    let imgPoint;
    let px, py;
    let ax, ay;
    let ax1, ay1;
    let ax2, ay2;

    i=0;

    //var m = new createjs.Matrix2D();
    //m.translate(x, y);
    //m.scale(0.9, 0.9);

    for (var crossId1 in this._crossDic) 
    {
      cross = this._crossDic[crossId1]

      svetoCont = new createjs.Container()
      svetoCont.name = 'svet_' + crossId1
      svetoCont.id = 'svet_' + crossId1
      svetoCont.x = 10 + (roadLen * cross.x + roadWidth * cross.x)
      svetoCont.y = 10 + (roadLen * cross.y + roadWidth * cross.y)
      this._stageTop.addChild(svetoCont)

      crossShape = new createjs.Shape()
      if (cross._crossId == this._finishCrossId) {
        crossShape.graphics.beginFill('gray')
      } else if (cross._crossId == this._startCrossId) {
        crossShape.graphics.beginFill('limegreen')
      } else {
        crossShape.graphics.beginFill('white')
      }

      if(crossId1 == this._startCrossId)
      {
        img = this.kioapi.getResource('start');
      }
      else{
        img = this.kioapi.getResource('cross');
      }

      

      crossShape.graphics.beginBitmapFill(img, "no-repeat");

      crossShape.graphics.drawRect(0, 0, roadWidth + 1, roadWidth + 1)
      crossShape.graphics.endFill()
      svetoCont.addChild(crossShape)

      point = this.getPointByCrossId(crossId1)

      ax = -999;
      ax1 = -999;
      ax2 = -999;

      if (point != null) 
      {
        pointShape = new createjs.Shape()
        //pointShape.graphics.beginFill('yellow')
        pointShape.graphics.beginStroke('yellow')
        pointShape.graphics.setStrokeStyle(2);
       
        px = 0;
        py = 0;


        if (cross.x == this._levelSettings.roadCountX - 1) 
        {
          // -- крайний правый ряд
          if (cross.y == 0) {
            // -- правый верхний угол
            px = -roadWidth;
            py = roadWidth;
            ax = -999;

          } else if (cross.y == this._levelSettings.roadCountY) {
            // -- правый нижний угол
            px = -roadWidth;
            py = -roadWidth;
            ax = -999;

          } else {
            px = -roadWidth;
            py = -roadWidth;
            ax = -roadWidth
            ay = roadWidth;
          }
        } 
        else if (cross.x == 0) 
        {
          // -- крайний левый ряд
          
          if (cross.y == this._levelSettings.roadCountY ) 
          {
            // -- левый нижний угол
            px = roadWidth;
            py = -roadWidth;
            //ax = roadWidth
            ay = -roadWidth;
          } 
          else if (cross.y == 0) 
          {
            // -- верхний левый угол
            px = roadWidth;
            py = roadWidth;
          } else {
            px = roadWidth;
            py = -roadWidth;
            ax = roadWidth
            ay = roadWidth;
          }
        } 
        else if (cross.y == 0) 
        {
          // -- верхний ряд
          px = roadWidth;
          py = roadWidth;
          ax = -roadWidth
          ay = roadWidth;

        } else if (cross.y == this._levelSettings.roadCountY) {
          // -- нижний ряд
          px = roadWidth;
          py = -roadWidth;
          ax = -roadWidth
          ay = -roadWidth;

        } else {
            px = roadWidth;
            py = -roadWidth;
            ax = -roadWidth
            ay = -roadWidth;

            ax1 = roadWidth
            ay1 = roadWidth;
            ax2 = -roadWidth
            ay2 = roadWidth;
        }
       
        n = i % 2;
        s = '_' + n;

        imgPoint = this.kioapi.getResource('point' + s);
        pointShape.graphics.beginBitmapFill(imgPoint, "no-repeat");
        pointShape.name = 'point_' + crossId1;
        pointShape.graphics.drawRect(2, 2, roadWidth - 5, roadWidth - 5)
        pointShape.x = px;
        pointShape.y = py;
        pointShape.graphics.endStroke()
        svetoCont.addChild(pointShape);


      }

      // -- перекресток верхнего уровня для клика и прорисовки

      crossShape = new createjs.Shape()
      crossShape.name = 'cross_' + crossId1
      crossShape.id = crossId1
      crossShape.x = 10 + (roadLen * cross.x + roadWidth * cross.x)
      crossShape.y = 10 + (roadLen * cross.y + roadWidth * cross.y)

      this._stageTop.addChild(crossShape)

      this._crossShapeDic[crossShape.name] = crossShape

      hit = new createjs.Shape()
      hit.graphics
        .beginFill('#000')
        .drawRect(0, 0, roadWidth + 1, roadWidth + 1)
      crossShape.hitArea = hit

      if (this._ggg == 0) {
        crossShape.on('click', function (event) {
          _thisProblem.clickCross(this.id)
        })
      }
      

      //-- Заполняем пустоту

      if(ax != -999)
      {
        pointShape = new createjs.Shape()
        //pointShape.graphics.beginStroke('red')
        //pointShape.graphics.setStrokeStyle(2);

        n = i % 7;
        s = '_' + n;

        imgPoint = this.kioapi.getResource('a' + s);
        pointShape.graphics.beginBitmapFill(imgPoint, "no-repeat");
        pointShape.graphics.drawRect(2, 2, roadWidth - 5, roadWidth - 5)
        pointShape.x = ax;
        pointShape.y = ay;
        svetoCont.addChild(pointShape);
      }
      if (ax1 != -999) 
      {
        n = (i + 1)% 7;
        s = '_' + n;
        pointShape = new createjs.Shape()
        imgPoint = this.kioapi.getResource('a' + s);
        pointShape.graphics.beginBitmapFill(imgPoint, "no-repeat");
        pointShape.graphics.drawRect(2, 2, roadWidth - 5, roadWidth - 5)
        pointShape.x = ax1;
        pointShape.y = ay1;
        svetoCont.addChild(pointShape);
      }
      if (ax2 != -999) {
        n = (i + 2) % 7;
        s = '_' + n;
        pointShape = new createjs.Shape()
        imgPoint = this.kioapi.getResource('a' + s);
        pointShape.graphics.beginBitmapFill(imgPoint, "no-repeat");
        pointShape.graphics.drawRect(2, 2, roadWidth - 5, roadWidth - 5)
        pointShape.x = ax2;
        pointShape.y = ay2;
        svetoCont.addChild(pointShape);
      }
      if (crossId1 == '0:0')
      {
        n = (i + 3) % 7;
        s = '_' + n;
        pointShape = new createjs.Shape()
        imgPoint = this.kioapi.getResource('a' + s);
        pointShape.graphics.beginBitmapFill(imgPoint, "no-repeat");
        pointShape.graphics.drawRect(2, 2, roadWidth - 5, roadWidth - 5)
        pointShape.x = roadWidth;
        pointShape.y = -roadWidth;
        svetoCont.addChild(pointShape);
      }


      i++;
    }

    let R

    for (i = 0; i < roadForCreateArr.length; i++) {
      R = roadForCreateArr[i]
      this.createRoad(
        R.vh,
        R.roadId,
        R.crossId,
        R.crossIdNext,
        R.x,
        R.y,
        R.X,
        R.Y
      )
    }

    // -- бордер по границам карты

    var border = new createjs.Shape()
    border.graphics.beginStroke('black')
    border.graphics.setStrokeStyle(2)
    border.graphics.drawRect(
      10,
      10,
      (roadCountX - 1) * roadLen + (roadCountX - 0) * roadWidth + 0,
      (roadCountY - 0) * roadLen + (roadCountY + 1) * roadWidth + 1
    )
    border.graphics.endFill()
    this._stageBottom.addChild(border)

    // -- контейнер для светофор инфо

    this._infoBoxConteiner = new createjs.Container()
    this._infoBoxConteiner.name = 'infoBoxConteiner'
    this._infoBoxConteiner.x =
      roadCountX * roadLen + roadCountX * roadWidth - 30
    this._infoBoxConteiner.y = 12
    // this._infoBoxConteiner .setBounds(0, 0, 210, 100);
    this._stageTop.addChild(this._infoBoxConteiner)

    // -- машинка

    let imgCar = this.kioapi.getResource('car');

    this._carW = roadWidth / 2

    this._goShape = new createjs.Shape()
    this._goShape.x = -10
    this._goShape.y = -10
    //this._goShape.graphics.beginFill('101, 255, 102')
    //this._goShape.graphics.beginStroke(createjs.Graphics.getRGB('101, 255, 102'));

    this._goShape.graphics.beginBitmapFill(imgCar, "no-repeat");
/*
    this._goShape.graphics.drawRoundRectComplex(
      0,
      0,
      this._carW,
      10,
      4,
      4,
      4,
      4
    )
    */
     this._goShape.graphics.drawRect(0,0, this._carW, 10);
    this._goShape.graphics.endStroke()
    //this._goShape.graphics.endFill()
    this._stageTop.addChild(this._goShape)

    this._ggg = 1
  }

  clickCross (crossId) {
    console.log('click cross id=' + crossId)

    let sveto = this.getSvetoByCrossId(crossId)

    if (sveto != null) {
      this._selectedCrossId = crossId
    }

    this.updateTracks(false)
  }

  roadDelOrSwitch (currentRoadId) {
    let resultDel = true
    let selectedRoad
    let ok
    let currentNode = this._fullTrackDic[currentRoadId]
    let currentCrossId = currentNode._crossId2

    if (currentCrossId == this._finishCrossId) {
      return resultDel
    }

    let nextRoadDic = {}
    let n = 0
    let excludedRoadId = ''
    let lastNode
    let s

    // -- Найдем отмеченные дороги из этого перекрестка

    n = 0

    for (var roadIdKey in this._roadSelectedDic) {
      selectedRoad = this._roadSelectedDic[roadIdKey]

      if (
        (selectedRoad._crossId1 == currentCrossId ||
          selectedRoad._crossId2 == currentCrossId) &&
        selectedRoad._id != currentRoadId
      ) {
        // -- это  отмеченная  дорога из нашего перекрестка
        ok = true
        // -- исключим дорогу, по которой уже проходит трак. Она нам как раз и не нужна
        lastNode = this._fullTrackDic[this._lastTrackRoadId]

        s = lastNode._roadIdList
        // -- исключим дороги которые дальше от нашей

        let pos = s.indexOf(',' + currentRoadId + ',')
        let pos1 = s.indexOf(',', pos + 1)
        pos1 = s.indexOf(',', pos1 + 1)

        if (pos1 > 1) {
          s = s.substr(0, pos1 + 1)
        }

        if (s.indexOf(',' + selectedRoad._id + ',') >= 0) {
          ok = false
          excludedRoadId = selectedRoad._id
        }

        if (ok) {
          nextRoadDic[selectedRoad._id] = 1
          n++

          if (n == 3) {
            break
          }
        }
      }
    }

    if (Helper.dicLen(nextRoadDic) > 0) {
      let key = currentRoadId + '_' + currentCrossId

      let nextNod = this.getNextTrackNode(currentRoadId)

      if (nextNod != null) {
        excludedRoadId = nextNod._road._id
      } else {
        excludedRoadId = currentRoadId
      }

      this._trackRoadCrossDic[key] = this.getNextRoadIdForClick(
        key,
        excludedRoadId,
        nextRoadDic
      )

      resultDel = false
    }

    return resultDel
  }

  _switchIdDic = {}

  getNextRoadIdForClick (key, currentId, nextRoadDic) {
    let i

    if (!this._switchIdDic.hasOwnProperty(key)) {
      this._switchIdDic[key] = []
    }

    let roadIdArr = this._switchIdDic[key]

    // -- наполняем массив новыми членами
    let newId
    let ok = false
    let len

    if (roadIdArr.length < 4) {
      for (var newIdKey in nextRoadDic) {
        ok = false

        len = roadIdArr.length

        for (i = 0; i < len; i++) {
          if (roadIdArr[i] == newIdKey) {
            ok = true
            break
          }
        }

        if (!ok) {
          roadIdArr.push(newIdKey)
        }
      }
    }

    // -- берем следующего после currentId

    let nextId = ''

    ok = false

    for (i = 0; i < roadIdArr.length; i++) {
      if (ok) {
        nextId = roadIdArr[i]
        break
      }

      if (roadIdArr[i] == currentId) {
        ok = true
      }
    }

    if (nextId == '') {
      nextId = roadIdArr[0]
    } else {
      console.log('ERRRRRRR currentId=' + currentId)
    }

    return nextId
  }

  createRoad (vh, roadId, crossId, crossIdNext, x, y, X, Y) {
    let road, isBlocked
    let bgColor
    let roadWidth = this._levelSettings.roadWidth
    let roadLen = this._levelSettings.roadLen
    let n, s;

    let img ;

    if(vh == 'v')
    {
        img = this.kioapi.getResource('road_v');
    }
    else{
        img = this.kioapi.getResource('road_h');
    }
    
    

    if (this.isRoadBlocked(roadId)) 
    {
      bgColor = this.BGCOLOR_KARTA
      isBlocked = true
    } else {
      bgColor = 'white'
      isBlocked = false
    }

    let roadShape = new createjs.Shape()
    //roadShape.graphics.beginFill(bgColor)
    roadShape.graphics.beginStroke('gray');
    roadShape.graphics.setStrokeStyle(1)
    roadShape.vh = vh
    roadShape.name = 'roadB_' + roadId
    roadShape.absX = x
    roadShape.absY = y;



    let x1, y1

    if (vh == 'v') {
      roadShape.x = 10 + (x * roadWidth + roadLen * x)
      roadShape.y = 10 + roadWidth + (y * roadLen + roadWidth * y) - 0
      roadShape.w = roadWidth
      roadShape.h = roadLen + 1

      x1 = roadWidth
      y1 = roadLen + 1
    } else {
      roadShape.x = 10 + (roadWidth * (x + 1) + roadLen * x)
      roadShape.y = 10 + (y * roadWidth + roadLen * y)
      roadShape.w = roadLen + 1
      roadShape.h = roadWidth
      x1 = roadLen + 1
      y1 = roadWidth
    }

   // roadShape.graphics.drawRect(0, 0, x1, y1)


    if(!isBlocked)
    {      
        roadShape.graphics.beginBitmapFill(img, "no-repeat");
        roadShape.graphics.drawRect(0, 0, x1, y1);
    }
    else{
      n = (3) % 7;
      s = '_' + n;
     // roadShape = new createjs.Shape()
      let imgPoint = this.kioapi.getResource('a' + s);
      roadShape.graphics.beginBitmapFill(imgPoint, "repeat");
      roadShape.graphics.drawRect(0, 0, x1, y1);
    }
    roadShape.graphics.endStroke();
   // roadShape.graphics.endFill();

    this._stageBottom.addChild(roadShape)

    // -- бордер по краям дороги

    let roadShapeBot = new createjs.Shape()
    // roadShapeBot.graphics.beginFill('green');
    roadShapeBot.graphics.beginStroke('gray')
    roadShapeBot.graphics.setStrokeStyle(2)
    // roadShapeBot.graphics.drawRect(0, 0, x1, y1);
    // roadShapeBot.graphics.endFill();
    roadShapeBot.x = roadShape.x
    roadShapeBot.y = roadShape.y
    roadShapeBot.absX = roadShape.absX
    roadShapeBot.absY = roadShape.absY

    if (isBlocked) {
      // -- дорога найдена в списке запрещенных
      if (roadShape.vh == 'v') {
        roadShapeBot.graphics.moveTo(0, 0)
        roadShapeBot.graphics.lineTo(roadWidth, 0)
        roadShapeBot.graphics.moveTo(0, roadLen)
        roadShapeBot.graphics.lineTo(roadWidth, roadLen)
      } else {
        roadShapeBot.graphics.moveTo(0, 0)
        roadShapeBot.graphics.lineTo(0, roadWidth)
        roadShapeBot.graphics.moveTo(roadLen, 0)
        roadShapeBot.graphics.lineTo(roadLen, roadWidth)
      }
    } else {
      if (roadShape.vh == 'v') {
        if (roadShapeBot.absX != 0) {
          roadShapeBot.graphics.moveTo(0, 0)
          roadShapeBot.graphics.lineTo(0, roadLen)
        }

        if (roadShapeBot.absX != this._levelSettings.roadCountX) {
          roadShapeBot.graphics.moveTo(roadWidth, 0)
          roadShapeBot.graphics.lineTo(roadWidth, roadLen)
        }
      } else {
        if (roadShapeBot.absY != 0) {
          // -- исключаем крайние границы
          roadShapeBot.graphics.moveTo(0, 0)
          roadShapeBot.graphics.lineTo(roadLen, 0)
        }

        if (roadShapeBot.absY != this._levelSettings.roadCountY) {
          roadShapeBot.graphics.moveTo(0, roadWidth)
          roadShapeBot.graphics.lineTo(roadLen, roadWidth)
        }
      }
    }

    roadShapeBot.graphics.endStroke()

    this._stageBottom.addChild(roadShapeBot)

    // -- дорога верхнего уровня для клика и прорисовки

    let roadShapeTop = new createjs.Shape()
    roadShapeTop.name = 'road_' + roadId
    roadShapeTop.id = roadId
    roadShapeTop.vh = vh
    roadShapeTop.x = roadShape.x
    roadShapeTop.y = roadShape.y
    roadShapeTop.absX = roadShape.absX
    roadShapeTop.absY = roadShape.absY
    roadShapeTop.w = roadShape.w
    roadShapeTop.h = roadShape.h

    let hit = new createjs.Shape()
    hit.graphics.beginFill('#000').drawRect(0, 0, x1, y1)
    roadShapeTop.hitArea = hit

    if (this._ggg == 0) {
      roadShapeTop.on('click', function (event) {
        _thisProblem.clickRoad(this.id)
      })
    }

    this._stageTop.addChild(roadShapeTop)

    road = new Road(roadId, crossId, crossIdNext, vh, X, Y, x, y)
    road._isBlocked = isBlocked

    this._roadDic[roadId] = road
  }

  clickRoad (roadId) {
    let road = this.getRoadById(roadId, '2')
    // console.log('click roadId=' + roadId + ' cid1=' + road._crossId1 + ' cid2=' + road._crossId2 + ' x=' + road.x + ' y=' + road.y);

    if (!this.isRoadBlocked(roadId)) {
      if (this.isRoadSelected(roadId)) {
        let del = true

        if (this._lastClickRoadId == roadId) {
          this._delClickCount++
        } else {
          this._delClickCount = 0
        }

        if (this._delClickCount < 4) {
          if (this.isRoadInTrack(roadId)) {
            del = this.roadDelOrSwitch(roadId)
          }
        } else {
          this._delClickCount = 0
        }

        if (del) {
          this._delClickCount = 0
          delete this._roadSelectedDic[roadId]
        }
      } else {
        this._roadSelectedDic[roadId] = road
        this._delClickCount = 0
        // this._delClickRoadId = '';
      }

      this.updateTracks(true)
    }

    this.saveCurrentSolution()

    this._lastClickRoadId = roadId
  }

  getRoadById (roadId, logSource) {
    if (this._roadDic.hasOwnProperty(roadId)) {
      return this._roadDic[roadId]
    } else {
      console.log(
        'Error! Road not found - id=' + roadId + ' logSource=' + logSource
      )
      return null
    }
  }

  getSelectedRoadById (roadId) {
    if (this._roadSelectedDic.hasOwnProperty(roadId)) {
      return this._roadSelectedDic[roadId]
    } else {
      return null
    }
  }

  isRoadNext (startCrossId, road2) {
    if (startCrossId == road2._crossId1 || startCrossId == road2._crossId2) {
      return true
    } else {
      return false
    }
  }

  getSvetoByCrossId (crossId) {
    if (this._svetoDic.hasOwnProperty(crossId)) {
      return this._svetoDic[crossId]
    } else {
      return null
    }
  }

  getPointByCrossId (crossId) {
    if (this._pointsDic.hasOwnProperty(crossId)) {
      return this._pointsDic[crossId]
    } else {
      return null
    }
  }

  getSvetoSide (currentCross, nextCross) {
    let side = ''

    if (currentCross.x < nextCross.x) {
      side = 'L'
    } else if (currentCross.x > nextCross.x) {
      side = 'R'
    } else if (currentCross.y > nextCross.y) {
      side = 'B'
    } else if (currentCross.y < nextCross.y) {
      side = 'T'
    }

    return side
  }

  getNewDirection (currentCross, nextCross) {
    let direct = ''

    if (currentCross.x < nextCross.x) {
      direct = 'R'
    } else if (currentCross.x > nextCross.x) {
      direct = 'L'
    } else if (currentCross.y > nextCross.y) {
      direct = 'T'
    } else if (currentCross.y < nextCross.y) {
      direct = 'B'
    }

    return direct
  }

  getCrossById (crossId) {
    if (this._crossDic.hasOwnProperty(crossId)) {
      return this._crossDic[crossId]
    } else {
      console.log('Error! Cross not found - id=' + crossId)
      return null
    }
  }

  getTrackRoadsByCrossId (crossId) {
    let node
    let resultDic = {}
    let n = 0
    for (var roadIdkey in this._fullTrackDic) {
      node = this._fullTrackDic[roadIdkey]

      if (node._crossId2 == crossId) {
        resultDic[node._road._id] = node._road

        n++

        if (n == 2) {
          break
        }
      }
    }

    return resultDic
  }

  trackAdd (currentTrakNode) {
    let trackAdded = false
    // console.log(currentTrakNode);
    // console.log('trackAdd() id=' + currentTrakNode._crossId2);
    let s, i, n, w
    let div
    let roadNext
    let currentRoad = currentTrakNode._road
    let pr
    let roadWidth = this._levelSettings.roadWidth
    let roadLen = this._levelSettings.roadLen

    if (this.isRoadBlocked(currentRoad._id)) {
      return false
    }

    let svetoSide
    let sveto
    let svetoCross = null

    let cross1

    let cross2
    let progForTik = ''

    // -- добавим принудительный поворот на этот трак

    s = currentTrakNode._parentRoadId + '_' + currentTrakNode._crossId1

    this._trackRoadCrossDic[s] = currentRoad._id

    if (currentTrakNode._crossId2 == this._finishCrossId) {
      this._isTrackFull = true
      //console.log('TRACK FULL - ' + currentTrakNode._crossId2)
      this._fullTrackDic = currentTrakNode._trackDic
      this._fullTrackRoadIds = currentTrakNode._roadIds
      this._lastTrackRoadId = currentRoad._id
      this._currentResult._tikCount = currentTrakNode._fullTikCount
      this._currentResult._waitCount = currentTrakNode._fullWaitCount
      this._currentResult._stopCount = currentTrakNode._fullStopCount
    } else {
      if (!this._isTrackFull) {
        this._fullTrackDic = currentTrakNode._trackDic
        this._lastTrackRoadId = currentRoad._id
        this._currentResult._tikCount = currentTrakNode._fullTikCount
        this._currentResult._waitCount = currentTrakNode._fullWaitCount
        this._currentResult._stopCount = currentTrakNode._fullStopCount
        this._fullTrackRoadIds = currentTrakNode._roadIds
      }
    }

    if (!this._isTrackFull) {
      // -- Пытаемся ехать дадьше

      // -- ищем светофор на конце текущей дороги

      sveto = this.getSvetoByCrossId(currentTrakNode._crossId2)

      if (sveto != null) {
        svetoCross = this.getCrossById(currentTrakNode._crossId2)
        cross1 = this.getCrossById(currentTrakNode._crossId1)

        // -- определяем, с какой стороны подъехали к светофору
        svetoSide = this.getSvetoSide(cross1, svetoCross)

        pr = sveto.getProgForTik(currentTrakNode._fullTikCount)
        progForTik = sveto.getMyProgForTik(
          svetoSide,
          currentTrakNode._fullTikCount
        )

        // console.log('svetoSide=' + svetoSide + ' pr=' + pr + ' progForTik=' + progForTik);
      } else {
        // console.log('SVETO null - startCrossId=' + currentTrakNode._crossId2);
      }
      // -- проверим, есть ли принудительный поворот на конце текущей дороги

      s = currentRoad._id + '_' + currentTrakNode._crossId2
      let roadAdded = false

      if (this._trackRoadCrossDic.hasOwnProperty(s)) {
        let nextRoadId = this._trackRoadCrossDic[s]

        // -- действует ли еще это правило поворота
        if (this.isRoadSelected(nextRoadId)) {
          roadNext = this._roadSelectedDic[nextRoadId]

          if (
            this.isRoadNext(currentTrakNode._crossId2, roadNext) &&
            currentRoad._id != roadNext._id
          ) {
            trackAdded = this.trackAddNextRoad(
              currentTrakNode,
              svetoCross,
              roadNext,
              progForTik,
              sveto,
              svetoSide
            )
            roadAdded = trackAdded
          }
        }
      }

      if (!roadAdded) {
        // -- принудительного поворота нет

        for (var roadIdkey in this._roadSelectedDic) {
          roadNext = this._roadSelectedDic[roadIdkey]

          if (
            this.isRoadNext(currentTrakNode._crossId2, roadNext) &&
            currentRoad._id != roadNext._id
          ) {
            // -- нашли следующую дорогу
            trackAdded = this.trackAddNextRoad(
              currentTrakNode,
              svetoCross,
              roadNext,
              progForTik,
              sveto,
              svetoSide
            )
            if (trackAdded) {
              break
            }
          }
        }
      }
    }

    return trackAdded
  }

  trackAddNextRoad (
    currentTrakNode,
    svetoCross,
    roadNext,
    progForTik,
    sveto,
    svetoSide
  ) {
    let roadAdded = false

    // -- проверяем, нет получилась ли петля маршрута
    // -- В маршруте не должно быть той же дороги

    // console.log('currentTrakNode._crossIdList=' + currentTrakNode._crossIdList);

    let canNext = true
    let i
    let nextCrossId

    // -- определяем петлю

    if (currentTrakNode._roadIdList.indexOf(',' + roadNext._id + ',') >= 0) {
      // console.log('petlia! - currentRoad._id=' + currentTrakNode._road._id  + ' roadNext._id=' + roadNext._id +  ' nId1=' + roadNext._crossId1 + ' nId2=' + roadNext._crossId2);
      canNext = false
    }

    if (canNext) {
      let tik = 1
      let cross2, newDir
      let svetoOK = false // -- можно ли вообще проехать светофор в нужном направлении

      if (svetoCross != null) {
        // в какую сторону от светофора едем
        // -- progForTik='RL'

        if (currentTrakNode._crossId2 == roadNext._crossId1) {
          nextCrossId = roadNext._crossId2
        } else {
          nextCrossId = roadNext._crossId1
        }

        cross2 = this.getCrossById(nextCrossId)

        newDir = this.getNewDirection(svetoCross, cross2)

        let nextProg
        i = 0

        if (sveto != null && progForTik.indexOf(newDir) < 0) {
          // -- светофор не пускает, ищем следующую программу
          do {
            i++
            tik++
            nextProg = sveto.getMyProgForTik(
              svetoSide,
              currentTrakNode._fullTikCount + tik - 1
            )

            // console.log('nextProg=' + nextProg + ' i=' + i + ' tik=' + tik + ' crid=' + sveto._crossId);

            if (nextProg.indexOf(newDir) >= 0) {
              // -- можно ехать дальше
              svetoOK = true
            } else {
            }
          } while (!svetoOK && i < sveto._programma.length)
        } else {
          svetoOK = true
        }

        // console.log('newDir=' + newDir + ' nextCrossId=' + nextCrossId + ' svetoOK=' + svetoOK);
      } else {
        svetoOK = true
      }

      if (svetoOK) {
        roadAdded = true
        let nextTrackNode = new TrackNode(
          roadNext,
          currentTrakNode,
          tik,
          this._startCrossId,
          ''
        )

        let hasNext = this.trackAdd(nextTrackNode)

        // if(!hasNext)
        {
          // console.log('Track STOP - last road=' + nextTrackNode._road._id);
          // console.log(nextTrackNode);
        }
      }
    }

    return roadAdded
  }

  startCalcTrack (roadId, LB) {
    let roadStart = this.getSelectedRoadById(roadId) // -- первая дорога маршрута

    if (roadStart != null) {
      let trackNode = new TrackNode(roadStart, null, 1, this._startCrossId, LB)

      this.trackAdd(trackNode)

      this._firstTrackRoadId = roadId
    }
  }

  getNextTrackNode (parentRoadId) {
    let trackNode

    for (let key in this._fullTrackDic) {
      trackNode = this._fullTrackDic[key]

      if (trackNode._parentRoadId == parentRoadId) {
        return trackNode
      }
    }

    return null
  }

  getTrackNodeByCrossId2 (crossId2) {
    let trackNode

    for (let key in this._fullTrackDic) {
      trackNode = this._fullTrackDic[key]

      if (trackNode._crossId2 == crossId2) {
        return trackNode
      }
    }

    return null
  }

  updateTracks (goToStart) {
    if (goToStart) {
      this.goToStart()
      this._goArr = []
    }
    let color;
    let bgColorSelected = createjs.Graphics.getRGB(3, 192, 255, 0.7)
    let bgColorTrack = createjs.Graphics.getRGB(101, 255, 102, 0.7)
    let bgColorTrackStrelka = createjs.Graphics.getRGB(16, 159, 16);   //(31, 191, 22, 0.8)

    let trackNode, node;
    let road, roadShape, croaaId1, crossId2
    let bgColor, bgColorCross
    let crossShape
    let roadWidth = this._levelSettings.roadWidth
    let roadLen = this._levelSettings.roadLen
    let s, x, y, n

    // -- расчет маршрута

    this._isTrackFull = false
    this._varCount = 0

    this._currentResult._tikCount = 0
    this._fullTrackDic = {}
    this._fullTrackRoadIds = []

    if (this._firstTrackRoadId == this._startRoadIdH) {
      this.startCalcTrack(this._startRoadIdH, 'R')
    } else if (this._firstTrackRoadId == this._startRoadIdV) {
      this.startCalcTrack(this._startRoadIdV, 'T')
    } else if (this._firstTrackRoadId == this._startRoadIdH2) {
      this.startCalcTrack(this._startRoadIdH2, 'L')
    } else if (this._firstTrackRoadId == this._startRoadIdV2) {
      this.startCalcTrack(this._startRoadIdV2, 'B')
    }

    if (Helper.dicLen(this._fullTrackDic) == 0) {
      this.startCalcTrack(this._startRoadIdH, 'R')
    }

    if (Helper.dicLen(this._fullTrackDic) == 0) {
      this.startCalcTrack(this._startRoadIdV, 'T')
    }

    if (Helper.dicLen(this._fullTrackDic) == 0) {
      this.startCalcTrack(this._startRoadIdH2, 'L')
    }

    if (Helper.dicLen(this._fullTrackDic) == 0) {
      this.startCalcTrack(this._startRoadIdV2, 'B')
    }

    // console.log(this._trackRoadCrossDic);
    // console.log(this._fullTrackDic);

    this.createCurrentSolution()

    
    //-- собираем список пройденных достопримов
    let dic = {}
    for (let roadIdKey in this._fullTrackDic) {
      node = this._fullTrackDic[roadIdKey]

      if (!dic.hasOwnProperty(node._crossId2)) {
        if (this.getPointByCrossId(node._crossId2) != null) {
          dic[node._crossId2] = 1
        }
      }
    }

    this._trackPointsDic = dic;

    // -- отрисовка

    this._slider.setTik(this._currentResult._tikCount)

    let crossIdDic = {}
    let isRoadInTrack
    this._stageTop.clear()
    let isRoadSelected;

    for (var crossIdkey in this._crossDic) {
      crossShape = this._stageTop.getChildByName('cross_' + crossIdkey)
      crossShape.graphics.clear()
    }

    for (var roadIdkey in this._roadDic) {
      isRoadInTrack = false
      road = this._roadDic[roadIdkey]

      if (this._fullTrackDic.hasOwnProperty(road._id)) {
        trackNode = this._fullTrackDic[road._id]
      } else {
        trackNode = null
      }

      roadShape = this._stageTop.getChildByName('road_' + road._id)

      isRoadSelected = this.isRoadSelected(road._id);

      if (isRoadSelected) 
      {
        if (this.isRoadInTrack(road._id)) {
          isRoadInTrack = true
          bgColor = bgColorTrack

          bgColorCross = bgColorTrack
        } else {
          isRoadInTrack = false
          bgColor = bgColorSelected
          bgColorCross = bgColorSelected
        }

        if (!crossIdDic.hasOwnProperty(road._crossId1) || isRoadInTrack) {
          crossIdDic[road._crossId1] = 1
          crossShape = this._stageTop.getChildByName('cross_' + road._crossId1)
          crossShape.graphics.clear()
          crossShape.graphics.beginFill(bgColorCross)
          crossShape.graphics.drawRect(1, 1, roadWidth - 2, roadWidth - 2)
          crossShape.graphics.endFill()
        }

        if (!crossIdDic.hasOwnProperty(road._crossId2) || isRoadInTrack) {
          crossIdDic[road._crossId2] = 1
          crossShape = this._stageTop.getChildByName('cross_' + road._crossId2)
          crossShape.graphics.clear()
          crossShape.graphics.beginFill(bgColorCross)
          crossShape.graphics.drawRect(1, 1, roadWidth - 2, roadWidth - 2)
          crossShape.graphics.endFill()
        }
      } 
      else {
        bgColor = 'white' 
      }

      if (!this.isRoadBlocked(road._id)) 
      {
        roadShape.graphics.clear()

        if(isRoadSelected)
        {
            roadShape.graphics.beginFill(bgColor)
            if (roadShape.vh == 'h') {
              roadShape.graphics.drawRect(-1, 1, roadShape.w + 1, roadShape.h - 2)
            } else {
              roadShape.graphics.drawRect(1, -1, roadShape.w - 2, roadShape.h + 1)
            }
            roadShape.graphics.endFill();
    
        }

        if (isRoadInTrack) {
          // -- рисуем стрелку направления трака

          roadShape.graphics.beginStroke(bgColorTrackStrelka)
          roadShape.graphics.setStrokeStyle(2)

          if (roadShape.vh == 'h') {
            if (trackNode._direct == 'L') {
              // -- влево
              roadShape.graphics
                .moveTo(roadLen - roadWidth, roadWidth / 2)
                .lineTo(roadLen - roadWidth / 2, roadWidth / 4)
                .lineTo(roadLen - roadWidth / 2, (roadWidth / 4) * 3)
                .lineTo(roadLen - roadWidth, roadWidth / 2)
              roadShape.graphics
                .moveTo(roadLen - roadWidth / 2, roadWidth / 2)
                .lineTo(roadLen, roadWidth / 2)
            } else {
              // -- вправо
              roadShape.graphics
                .moveTo(roadWidth / 2, roadWidth / 4)
                .lineTo(roadWidth, roadWidth / 2)
                .lineTo(roadWidth / 2, (roadWidth / 4) * 3)
                .lineTo(roadWidth / 2, roadWidth / 4)
              roadShape.graphics
                .moveTo(0, roadWidth / 2)
                .lineTo(roadWidth / 2, roadWidth / 2)
            }
          } else {
            if (trackNode._direct == 'T') {
              // -- вверх
              roadShape.graphics
                .moveTo(roadWidth / 4, roadLen - roadWidth / 2)
                .lineTo(roadWidth / 2, roadLen - roadWidth)
                .lineTo((roadWidth / 4) * 3, roadLen - roadWidth / 2)
                .lineTo(roadWidth / 4, roadLen - roadWidth / 2)
              roadShape.graphics
                .moveTo(roadWidth / 2, roadLen)
                .lineTo(roadWidth / 2, roadLen - roadWidth / 2)
            } else {
              // -- вниз
              roadShape.graphics
                .moveTo(roadWidth / 4, roadWidth / 2)
                .lineTo((roadWidth / 4) * 3, roadWidth / 2)
                .lineTo(roadWidth / 2, roadWidth)
                .lineTo(roadWidth / 4, roadWidth / 2)
              roadShape.graphics
                .moveTo(roadWidth / 2, 0)
                .lineTo(roadWidth / 2, roadWidth / 2)
            }
          }

          // -- проверим, есть ли принудительный поворот на конце текущей дороги

          // s = road._id + '_' + trackNode._crossId2;

          // let nextRoadId = this._trackRoadCrossDic[s];

          // if(this._trackRoadCrossDic.hasOwnProperty(s))
          {
            // -- действует ли еще это правило поворота
            // if(this.isRoadSelected(nextRoadId))
            {
              // roadNext = this._roadSelectedDic[nextRoadId];

              // if (this.isRoadNext(trackNode._crossId2, roadNext) && road._id != roadNext._id)
              {
                let nextTrackNode = this.getNextTrackNode(road._id)

                if (nextTrackNode != null) {
                  // if(this._fullTrackDic.hasOwnProperty(roadNext._id))
                  // console.log('nnnnnn0 -roadId=' + road._id + ' nextTrackNode._direct=' + nextTrackNode._direct + ' trackNode._direct=' + trackNode._direct);

                  if (nextTrackNode._road._vh == 'h') {
                    if (nextTrackNode._direct == 'L') {
                      if (trackNode._direct == 'T') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadWidth / 2)
                          .curveTo(
                            roadWidth / 2,
                            -roadWidth / 2,
                            0,
                            -roadWidth / 2
                          )
                      } else if (trackNode._direct == 'B') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadLen - roadWidth / 2)
                          .curveTo(
                            roadWidth / 2,
                            roadLen + roadWidth / 2,
                            0,
                            roadLen + roadWidth / 2
                          )
                      } else if (trackNode._direct == 'L') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadWidth / 2)
                          .lineTo(-roadWidth, roadWidth / 2)
                      }
                    } else {
                      if (trackNode._direct == 'T') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadWidth / 2)
                          .curveTo(
                            roadWidth / 2,
                            -roadWidth / 2,
                            roadWidth,
                            -roadWidth / 2
                          )
                      } else if (trackNode._direct == 'B') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadLen - roadWidth / 2)
                          .curveTo(
                            roadWidth / 2,
                            roadLen + roadWidth / 2,
                            roadWidth,
                            roadLen + roadWidth / 2
                          )
                      } else if (trackNode._direct == 'R') {
                        roadShape.graphics
                          .moveTo(roadLen - roadWidth / 2, roadWidth / 2)
                          .lineTo(roadLen + roadWidth, roadWidth / 2)
                      }
                    }
                  } else {
                    if (nextTrackNode._direct == 'T') {
                      if (trackNode._direct == 'R') {
                        roadShape.graphics
                          .moveTo(roadLen - roadWidth / 2, roadWidth / 2)
                          .curveTo(
                            roadLen + roadWidth / 2,
                            roadWidth / 2,
                            roadLen + roadWidth / 2,
                            0
                          )
                      } else if (trackNode._direct == 'L') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadWidth / 2)
                          .curveTo(
                            -roadWidth / 2,
                            roadWidth / 2,
                            -roadWidth / 2,
                            0
                          )
                      } else if (trackNode._direct == 'T') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadWidth / 2)
                          .lineTo(roadWidth / 2, -roadWidth)
                      }
                    } else {
                      if (trackNode._direct == 'R') {
                        roadShape.graphics
                          .moveTo(roadLen, roadWidth / 2)
                          .curveTo(
                            roadLen + roadWidth / 2,
                            roadWidth / 2,
                            roadLen + roadWidth / 2,
                            roadWidth
                          )
                      } else if (trackNode._direct == 'L') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadWidth / 2)
                          .curveTo(
                            -roadWidth / 2,
                            roadWidth / 2,
                            -roadWidth / 2,
                            roadWidth
                          )
                      } else if (trackNode._direct == 'B') {
                        roadShape.graphics
                          .moveTo(roadWidth / 2, roadLen - roadWidth / 2)
                          .lineTo(roadWidth / 2, roadLen + roadWidth)
                      }
                    }
                  }
                }
              }
            }
          }

          roadShape.graphics.endStroke()
        }

       // roadShape.graphics.endFill()
      }
    }

    let canF
    let sveto
    let sidePr, pr

    if (
      this._selectedCrossId != '' &&
      this._selectedCrossId != this._finishCrossId
    ) {
      // -- отрисовка отмеченного светофора
    
      this.drawSvetInfoPanel();
    }

    for (let crossIdKey in this._svetoDic) 
    {
      sveto = this._svetoDic[crossIdKey]

      canF = false

      crossShape = this._crossShapeDic['cross_' + sveto._crossId]

      pr = sveto.getProgForTik(this._globalTik)

      sidePr = sveto.getProgForSide('T', pr)
      canF = sidePr.indexOf('B') >= 0

      if (this.hasRoadDir(sveto._crossId, 'T')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'T', canF)
      }
      if (this.hasRoadDir(sveto._crossId, 'B')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'B', canF)
      }

      sidePr = sveto.getProgForSide('L', pr)
      canF = sidePr.indexOf('R') >= 0

      if (this.hasRoadDir(sveto._crossId, 'L')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'L', canF)
      }
      if (this.hasRoadDir(sveto._crossId, 'R')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'R', canF)
      }
    }

    let pointShape, svetoCont;

    for (let crossIdKey in this._crossDic)
    {
          
      svetoCont = this._stageTop.getChildByName('svet_' + crossIdKey);

      if(svetoCont)
      {
        pointShape = svetoCont.getChildByName('point_' + crossIdKey);

        if(pointShape)
        {
          if(this._trackPointsDic.hasOwnProperty(crossIdKey))
          {
            color = 'blue';
          }
          else{
            color = 'yellow';
          }
          pointShape.graphics.beginStroke(color);
          pointShape.graphics.setStrokeStyle(2);
          pointShape.graphics.drawRect(2, 2, roadWidth - 5, roadWidth - 5);
          pointShape.graphics.endStroke();
        }
      }
    }

    this.updateTop();
  }

  drawSvetInfoPanel()
  {
    if(this._selectedCrossId == '')
    {
      return;
    }
    let roadWidth = this._levelSettings.roadWidth
    let roadLen = this._levelSettings.roadLen
    let color
    let crossShape = this._stageTop.getChildByName( 'cross_' + this._selectedCrossId )
    crossShape.graphics.clear()
    
    crossShape.graphics.beginFill(
      //createjs.Graphics.getRGB(239, 239, 127, 0.7)
      createjs.Graphics.getRGB(242, 255, 8, 0.9)
    )
    crossShape.graphics.drawRect(1, 1, roadWidth - 2, roadWidth - 2)
    crossShape.graphics.endFill()

    let sveto = this.getSvetoByCrossId(this._selectedCrossId)

    if (sveto != null) {
      let svShape1, svShape, svetoCont
      let r = 5
      let w = 80
      let h = 80
      let pr, sidePr
      let canF, canL, canR
      let trackProgInx
      let roadsArr

      let node = this.getTrackNodeByCrossId2(this._selectedCrossId)

      if (node != null) {
        trackProgInx = sveto.getProgIndexByTik(node._fullTikCount)
      } else {
        trackProgInx = -1
      }

      trackProgInx = sveto.getProgIndexByTik(this._globalTik);

      this._infoBoxConteiner.removeAllChildren()

      for (let i = 0; i < sveto._programma.length; i++) {
        svetoCont = new createjs.Container()
        svetoCont.name = 'infoBoxConteiner'
        svetoCont.id = 'svetocont_' + i
        svetoCont.x = 0
        svetoCont.y = w * i + 20 * i
        this._infoBoxConteiner.addChild(svetoCont)

        svetoCont.on('click', function (evt) {
          console.log('svetoCont click id=' + this.id)
        })

        // -- контур

        svShape = new createjs.Shape()
        svShape.id = 'svk' + i
        svShape.name = svShape.id
        svShape.x = 0
        svShape.y = 0

        if(i == trackProgInx)
        {
          color = 'black'
        }
        else{
          color = 'silver'
        }
        

        svShape.graphics.beginStroke(color)
        svShape.graphics.setStrokeStyle(2)
        svShape.graphics.drawRect(-2, -2, w + 2, w + 2)
        svShape.graphics.endStroke()

        svetoCont.addChild(svShape)

        pr = sveto._programma[i]

        canF = false
        canR = false
        canL = false

        // -- верхний

        if (this.hasRoadDir(sveto._crossId, 'T')) {
          sidePr = sveto.getProgForSide('T', pr)
          // -- LBR
          canF = sidePr.indexOf('B') >= 0
          canL = sidePr.indexOf('R') >= 0
          canR = sidePr.indexOf('L') >= 0
          canL = canF
          canR = canF

          SvetoHelper.drawSvetOne(svetoCont, w, 'T', canF, canL, canR)
        }

        // -- нижний
        if (this.hasRoadDir(sveto._crossId, 'B')) {
          sidePr = sveto.getProgForSide('B', pr)
          // -- LBR
          canF = sidePr.indexOf('T') >= 0
          canL = sidePr.indexOf('L') >= 0
          canR = sidePr.indexOf('R') >= 0

          canL = canF
          canR = canF

          SvetoHelper.drawSvetOne(svetoCont, w, 'B', canF, canL, canR)
        }

        if (this.hasRoadDir(sveto._crossId, 'L')) {
          sidePr = sveto.getProgForSide('L', pr)
          canF = sidePr.indexOf('R') >= 0
          canL = sidePr.indexOf('T') >= 0
          canR = sidePr.indexOf('B') >= 0

          canL = canF
          canR = canF

          SvetoHelper.drawSvetOne(svetoCont, w, 'L', canF, canL, canR)
        }

        if (this.hasRoadDir(sveto._crossId, 'R')) {
          sidePr = sveto.getProgForSide('R', pr)
          canF = sidePr.indexOf('L') >= 0
          canR = sidePr.indexOf('T') >= 0
          canL = sidePr.indexOf('B') >= 0

          canL = canF
          canR = canF

          SvetoHelper.drawSvetOne(svetoCont, w, 'R', canF, canL, canR)
        }
      }
    }
  
  }

  hasRoadDir (crossId, roadSide) {
    let i
    let roads = this.getRoadsForCross(crossId)
    let road
    let result = false
    let cross = this.getCrossById(crossId)

    for (i = 0; i < roads.length; i++) {
      road = roads[i]

      if (!this.isRoadBlocked(road._id)) {
        if (road._vh == 'v') {
          if (roadSide == 'T') {
            if (road.y < cross.y) {
              return true
            }
          } else if (roadSide == 'B') {
            if (road.y == cross.y) {
              return true
            }
          }
        } else {
          if (roadSide == 'L') {
            if (road.x < cross.x) {
              return true
            }
          }
          if (roadSide == 'R') {
            if (road.x == cross.x) {
              return true
            }
          }
        }
      }
    }

    return result
  }

  getRoadsForCross (crossId) {
    let road
    let cnt = 0
    let roadsArr = []

    for (let roadIdKey in this._roadDic) {
      road = this._roadDic[roadIdKey]

      if (road._crossId1 == crossId || road._crossId2 == crossId) {
        cnt++
        roadsArr.push(road)

        if (cnt == 4) {
          break
        }
      }
    }

    return roadsArr
  }

  getTrackNode (roadId) {
    if (this._fullTrackDic.hasOwnProperty(roadId)) {
      return this._fullTrackDic[roadId]
    } else {
      return null
    }
  }

  isRoadInTrack (roadId) {
    if (this._fullTrackDic.hasOwnProperty(roadId)) {
      return true
    } else {
      return false
    }
  }

  createCurrentSolution () 
  {
    // console.log('createCurrentSolution()');

    this._currentSolution._roadSelectedDic = this._roadSelectedDic
    this._currentSolution._trackRoadCrossDic = this._trackRoadCrossDic
    this._currentSolution._firstTrackRoadId = this._firstTrackRoadId
    this._currentSolution._isTrackFull = this._isTrackFull
    this._currentSolution._tikCount = this._currentResult._tikCount
    this._currentSolution._waitCount = this._currentResult._waitCount
    this._currentSolution._roadCount = Helper.dicLen(this._fullTrackDic)
    this._currentSolution._stopCount = this._currentResult._stopCount

    let node
    let cnt = 0
    let dic = {}

    for (let roadIdKey in this._fullTrackDic) {
      node = this._fullTrackDic[roadIdKey]

      if (!dic.hasOwnProperty(node._crossId2)) {
        if (this.getPointByCrossId(node._crossId2) != null) {
          cnt++
          dic[node._crossId2] = 1
        }
      }
    }

      this._currentSolution._pointCount = cnt
  
  }

  saveCurrentSolution () {
    this.kioapi.submitResult({
      _isTrackFull: this._currentSolution._isTrackFull,
      _roadCount: this._currentSolution._roadCount,
      _tikCount: this._currentSolution._tikCount,
      _waitCount: this._currentSolution._waitCount,
      _stopCount: this._currentSolution._stopCount,
      _pointCount: this._currentSolution._pointCount
    })
  }

  isRoadSelected (roadId) {
    if (this._roadSelectedDic.hasOwnProperty(roadId)) {
      return true
    } else {
      return false
    }
  }

  isRoadBlocked (roadId) {
    if (this._blocksMap.hasOwnProperty(roadId)) {
      return true
    } else {
      return false
    }
  }

  clear () {
    _thisProblem.clearAllSelecteRoads()
  }

  clearAllSelecteRoads () {
    this._roadSelectedDic = {}
    this.updateTracks(true)
  }

  updateAll () {
    this.updateBottom()
    this.drawSveto()
    this.updateTop()
  }
  updateTop () {
    this._stageTop.update()
  }
  updateBottom () {
    this._stageBottom.update()
  }

  drawSveto () {
    // console.log('drawSveto() _globalTik=' + this._globalTik);
    let sveto, crossShape
    let canF, pr, sidePr

    this.drawSvetInfoPanel();

    for (let crossIdKey in this._svetoDic) {
      sveto = this._svetoDic[crossIdKey]

      canF = false

      crossShape = this._crossShapeDic['cross_' + sveto._crossId]

      pr = sveto.getProgForTik(this._globalTik)

      sidePr = sveto.getProgForSide('T', pr)
      canF = sidePr.indexOf('B') >= 0

      if (this.hasRoadDir(sveto._crossId, 'T')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'T', canF)
      }
      if (this.hasRoadDir(sveto._crossId, 'B')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'B', canF)
      }

      sidePr = sveto.getProgForSide('L', pr)
      canF = sidePr.indexOf('R') >= 0

      if (this.hasRoadDir(sveto._crossId, 'L')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'L', canF)
      }
      if (this.hasRoadDir(sveto._crossId, 'R')) {
        SvetoHelper.drawSvetOne2(crossShape, 30, 'R', canF)
      }
    }

    

    this.updateTop()
  }
}
