import React,{useState} from 'react';
import shortid from 'shortid'
import db from '../db.js'
import t from '../components/t.js'
import { Divider,Row,Col,Modal,Button,Drawer,Table, Popover,Popconfirm,Tooltip} from 'antd';
import {EditOutlined} from '@ant-design/icons'

import ScrollBars from 'react-custom-scrollbars'

import {EventList} from '../components/event.js'
import {SkillList} from '../components/skill.js'
import {BuffButton} from '../components/buff.js'
import {RaceSchedule,RaceTimeline,RaceCheckbox} from '../components/race.js'

import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css'
import Race from './race.js'
import Player from './player.js'
import Support from './support.js'


const cdnServer = 'https://cdn.jsdelivr.net/gh/wrrwrr111/pretty-derby@master/public/'


const Nurturing = () =>{
  const [needSelect,setNeedSelect] = useState(false)
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  const [isSupportVisible, setIsSupportVisible] = useState(false);
  const [supportIndex, setSupportIndex] = useState(1);


  const selected = db.get('selected').value()
  const [supports, setSupports] = useState(selected.supports);
  const [player, setPlayer] = useState(selected.player);

  const races = db.get('races').value()
  const [raceFilterCondition,setRaceFilterCondition] = useState(selected.raceFilterCondition||{
    distanceType:[],
    grade:[],
    ground:[]})
  const [filterRace,setFilterRace] = useState(selected.filterRace||{})

  const [decks,setDecks] = useState(db.get('myDecks').value())

  const showPlayer = () => {
    setIsPlayerVisible(true);
  };
  const closePlayer = () => {
    setIsPlayerVisible(false);
  };
  const handleSelectPlayer = (data)=>{
    setIsPlayerVisible(false);
    setPlayer(data)

    // save
    selected.player = data
    db.get('selected').assign(selected).write()
  }

  const showSupport = (index) => {
    setNeedSelect(true)
    setIsSupportVisible(true);
    setSupportIndex(index)
  };
  const showSupport2 = (index) => {
    setNeedSelect(false)
    setIsSupportVisible(true);
    setSupportIndex(index)
  };

  const closeSupport = () => {
    setIsSupportVisible(false);
  };
  const handleSelectSupport = (data)=>{
    let newData= {}
    newData[supportIndex] = data
    setSupports(Object.assign({},supports,newData))
    setIsSupportVisible(false);

    // save
    selected.supports[supportIndex] = data
    db.get('selected').assign(selected).write()
  }


  // 卡组相关操作
  const saveDeck = (deck)=>{
    let tmpDeck = {
      imgUrls:[],
      supportsId:[],
    }
    if(player.id){
      tmpDeck.playerId = player.id
      tmpDeck.imgUrls.push(player.imgUrl)
    }
    [0,1,2,3,4,5].forEach(index=>{
      if(supports[index]&&supports[index].id){
        tmpDeck.imgUrls.push(supports[index].imgUrl)
        tmpDeck.supportsId.push(supports[index].id)
      }else{
        tmpDeck.supportsId.push(null)
      }
    })
    if(deck){
      //update
      db.get('myDecks').find({id:deck.id}).assign(tmpDeck).write()
    }else{
      //
      tmpDeck.id = shortid.generate()
      db.get('myDecks').push(tmpDeck).write()
    }
    setDecks([...db.get('myDecks').value()])
  }
  const loadDeck = (deck)=>{
    selected.supports={0:{},1:{},2:{},3:{},4:{},5:{}}
    selected.player={}
    if(deck.playerId){
      selected.player = db.get('players').find({id:deck.playerId}).value()
    }
    setPlayer(selected.player)
    deck.supportsId.forEach((id,index)=>{
      if(id){
        selected.supports[index]=db.get('supports').find({id:id}).value()
      }
    })
    setSupports({...selected.supports})
    db.get('selected').assign(selected).write()
  }
  const deleteDeck = (deck)=>{
    db.get('myDecks').remove({id:deck.id}).write()
    setDecks([...db.get('myDecks').value()])
  }

  // race checkbox发生变化
  const onChangeRace = (filterCondition)=>{
    setRaceFilterCondition(filterCondition)
    //根据条件过滤
    let tmpRaceList = Object.values(filterCondition).some(f => f.length > 0)
      ? Object.entries(filterCondition)
        .filter(([key, filters]) => filters.length > 0)
        .reduce((result, [key, filters]) => result.filter(race => filters.includes(race[key])), races)
      : [];
    //过滤后整理成 dataNum:[raceId]
    let tmpFilterRace = {}
      for(let race of tmpRaceList){
        if(tmpFilterRace[race.dateNum]){
          tmpFilterRace[race.dateNum].push(race.id)
        }else{
          tmpFilterRace[race.dateNum]=[race.id]
        }
      }
    //更新state
    setFilterRace(tmpFilterRace)
    selected.raceFilterCondition = filterCondition
    selected.filterRace = tmpFilterRace
    db.get('selected').assign({...selected}).write()
  }

  const useViewport = () => {
    const [width, setWidth] = React.useState(window.innerWidth);
    const [height,setHeight] = React.useState(window.innerHeight);
    React.useEffect(() => {
      const handleWindowResize = () => {
        setHeight(window.innerHeight)
        setWidth(window.innerWidth)
      };
      window.addEventListener("resize", handleWindowResize);
      return () => window.removeEventListener("resize", handleWindowResize);
    }, []);
    // console.log('currentWidth::',height);
    return {height,width};
  };

  const dynamicContentHeight = useViewport().height -128
  // 宽度0.3 高度0.5 取较小值
  const dynamicCardHeight = Math.min(Math.floor(dynamicContentHeight / 2),Math.floor(useViewport().width * 0.3))
  const dynamicCardWidth = Math.floor(dynamicCardHeight * 3 / 4)
  const dynamicCardBoxWidth = dynamicCardWidth * 3

  const dynamicRowHeight = Math.floor((useViewport().height -128-40)/18)

  const layoutWithBlank=[
    {i: 'a', x: 0, y: 0, w: 2, h: 2},
    {i: 'b', x: 2, y: 0, w: 7, h: 2},
    {i: 'c', x: 0, y: 2, w: 9, h: 7},
    {i: 'd', x: 0, y: 10, w: 4, h: 7},
    {i: 'e', x: 4, y: 10, w: 5, h: 7},
    // {i: 'w', x: 5, y: 10, w: 6, h: 7},
    {i: 's0', x: 17, y: 0, w: 5, h: 8},
    {i: 's1', x: 22, y: 0, w: 5, h: 8},
    {i: 's2', x: 27, y: 0, w: 5, h: 8},
    {i: 's3', x: 17, y: 9, w: 5, h: 8},
    {i: 's4', x: 22, y: 9, w: 5, h: 8},
    {i: 's5', x: 27, y: 9, w: 5, h: 8},
  ]
  const layoutWithoutBlank=[
    {i: 'a', x: 0, y: 0, w: 2, h: 2},
    {i: 'b', x: 2, y: 0, w: 9, h: 2},
    {i: 'c', x: 0, y: 2, w: 11, h: 7},
    {i: 'd', x: 0, y: 10, w: 5, h: 7},
    {i: 'e', x: 5, y: 10, w: 6, h: 7},
    // {i: 'w', x: 5, y: 10, w: 6, h: 7},
    {i: 's0', x: 11 , y: 0, w: 7, h: 8},
    {i: 's1', x: 18, y: 0, w: 7, h: 8},
    {i: 's2', x: 25, y: 0, w: 7, h: 8},
    {i: 's3', x: 11, y: 9, w: 7, h: 8},
    {i: 's4', x: 18, y: 9, w: 7, h: 8},
    {i: 's5', x: 25, y: 9, w: 7, h: 8},
  ]
  const originalLayout = db.get('layout').value()||layoutWithoutBlank
  const [layout,setLayout]=useState(originalLayout)
  const onLayoutChange=(layout)=> {
    /*eslint no-console: 0*/
    db.set('layout',layout).write()
    setLayout(layout)
    // onLayoutChange(layout); // updates status display
  }
  const panelStyle = {
    borderRadius:16,
    backgroundColor:'white',
  }
  const headStyle = {
    width:'100%',
    textAlign:'center',
    backgroundColor:'#ccc',
    cursor:'move'
  }
  const pBodyStyle={
    height:'calc(100% - 22px)'
  }
  return(<>
    <GridLayout cols={32} layout={layout} 
    draggableCancel='.panel-title' draggableHandle='.panel-heading' 
      rowHeight={dynamicRowHeight} width={useViewport().width-10}
      onLayoutChange={onLayoutChange}>

      <div key='a' style={{...panelStyle}}>
        <div className='panel-heading' style={{...headStyle}}>{t('角色')}</div>
          {player.id&&
            <img src={cdnServer+player.imgUrl} alt={player.imgUrl}
            style={{...pBodyStyle}}  onClick={showPlayer}>
          </img>}
      </div>
      <div key='b' style={{...panelStyle}}>
        <div className='panel-heading' style={{...headStyle}}>{t('操作')}</div>
        <Button className='add-player' type={'primary'} onClick={showPlayer}>{t('选择马娘')}</Button>
        <Button onClick={showSupport2}>{t('支援卡查询')}</Button>
        <BuffButton/>
        <Popover content={<RaceCheckbox onChange={onChangeRace} raceFilterCondition={raceFilterCondition}></RaceCheckbox>}>
          <Button>{t('比赛')}</Button>
        </Popover>
        <Popover width={'100%'} content={
          <>
                <Button onClick={()=>saveDeck()}>{t('保存为新卡组')}</Button>
                {decks.map(deck=>
                  <Row key={deck.id}>
                    {deck.imgUrls.map(imgUrl=>
                      <Col span={3} key={imgUrl}>
                        <img src={cdnServer+imgUrl} alt={imgUrl} width={'100'}></img>
                      </Col>
                    )}
                    <Col span={3}>
                      <Button type="primary" onClick={()=>loadDeck(deck)}>{t('读取卡组')}</Button>
                      <Popconfirm title={t("确认覆盖？")} onConfirm={()=>saveDeck(deck)}>
                        <Button danger type="dashed">{t('覆盖卡组')}</Button>
                      </Popconfirm>
                      <Popconfirm title={t("确认删除？")} onConfirm={()=>deleteDeck(deck)}>
                        <Button danger type="dashed">{t('删除卡组')}</Button>
                      </Popconfirm>
                    </Col>
                  </Row>
                )}
              </>
            }><Button>{t('我的卡组')}</Button>
        </Popover>
        <Button onClick={()=>setLayout(layoutWithBlank)}>{t('初始化布局(有留白)')}</Button>
        <Button onClick={()=>setLayout(layoutWithoutBlank)}>{t('初始化布局(无留白)')}</Button>
      </div>
      <div key='c'  style={{...panelStyle}}>
        <div className='panel-heading' style={{...headStyle}}>{t('事件')}</div>
        <ScrollBars autoHide={true} style={{...pBodyStyle}}>
          <EventList eventList={player.eventList||[]} pid={player.id}></EventList>
        </ScrollBars>
      </div>
      <div key='d' style={{...panelStyle}}>
        <div className='panel-heading' style={{...headStyle}}>{t('技能')}</div>
        <ScrollBars autoHide={true} style={{...pBodyStyle}}>
          <SkillList skillList={player.skillList||[]}></SkillList>
        </ScrollBars>
      </div>
      <div key='e' style={{...panelStyle}}>
        <div className='panel-heading' style={{...headStyle}}>{t('比赛')}</div>
        <ScrollBars autoHide={true} style={{...pBodyStyle}}>
          <RaceTimeline raceList={player.raceList||[]} filterRace={filterRace}></RaceTimeline>
        </ScrollBars>
      </div>

        {[0,1,2,3,4,5].map(index=>{
          let support = supports[index];
          if(support.id){
            return(
            <div key={`s${index}`} style={{...panelStyle}}>
              <div className='panel-heading' style={{...headStyle}}>
                <span className='panel-title' onClick={()=>showSupport(index)} style={{cursor:'pointer'}}>{t('选择支援卡')}</span>
              </div>
              <ScrollBars  autoHide={true} style={{...pBodyStyle}}>

              <div style={{display:'flex'}}>
                <img style={{width:'26%',height:'39%'}} src={cdnServer+support.imgUrl} alt={support.imgUrl}></img>
                <div style={{flex:'1 1 auto'}}>
                  {/* <Divider style={{margin:'4px 0',background:'rgba(255,255,255,0.6)'}}>事件</Divider> */}
                <EventList eventList={supports[index].eventList} pid={supports[index].id} ></EventList>
                </div>

              </div>
                    {/* <SkillList skillList={[...new Set(supports[index].skillList)]} ></SkillList> */}
                    <Divider style={{margin:'4px 0',background:'rgba(255,255,255,0.6)'}}>培训技能</Divider>
                    <SkillList skillList={supports[index].possessionSkill}></SkillList>
                    <Divider style={{margin:'4px 0',background:'rgba(255,255,255,0.6)'}}>事件技能</Divider>
                    <SkillList skillList={supports[index].trainingEventSkill}></SkillList>
              </ScrollBars>
            </div>
            )
          }else{
            return(
              <div key={`s${index}`} style={{...panelStyle}}>
                <Button onClick={()=>showSupport(index)}>{t('选择支援卡')}</Button>
              </div>
            )
          }
        })}

    </GridLayout>
      <Modal visible={isPlayerVisible} onOk={closePlayer} onCancel={closePlayer} width={'80%'}>
        <Player onSelect={handleSelectPlayer}></Player>
      </Modal>
      <Modal visible={isSupportVisible} onOk={closeSupport} onCancel={closeSupport} width={'80%'}>
        <Support onSelect={needSelect?handleSelectSupport:null}></Support>
      </Modal>
    </>
  )
}

export default Nurturing


