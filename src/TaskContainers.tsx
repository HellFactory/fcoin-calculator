import useSWR from 'swr'
import axios from 'axios'
import times from 'lodash/times'
import { useRecoilState } from 'recoil'
import { Button, Col, Divider, Form, Input, List, Modal, Row, Select, Typography } from 'antd'
import taskState, { SessionType, TaskStateType, TaskType } from './recoil/task-state'
import { useForm } from 'antd/es/form/Form'
import { nanoid } from 'nanoid'
import qs from 'qs'
import { useMemo, useState } from 'react'
import { fetcher } from './utils/fetcher'
import { PauseOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useInterval } from 'beautiful-react-hooks'

const { Option } = Select
const CreateTaskItem: React.FC<{ session: SessionType }> = ({ session }) => {
  const [state, setState] = useRecoilState(taskState)
  const { currentSessionIndex } = useMemo(() => {
    const index = state.session.findIndex(s => s.macroId === session.macroId)
    return {
      currentSession: state.session[index],
      currentSessionIndex: index,
    }
  }, [session])
  const [form] = useForm()
  const onFinish = (values: any) => {
    setState({
      ...state,
      session: [
        ...state.session.slice(0, currentSessionIndex),
        {
          ...state.session[currentSessionIndex],
          tasks: [
            ...state.session[currentSessionIndex].tasks,
            {
              id: nanoid(),
              ...values,
            },
          ],
        },
        ...state.session.slice(currentSessionIndex + 1),
      ],
    })
    form.resetFields()
  }
  return (
    <section style={{ textAlign: 'left' }}>
      <Form
        form={form}
        initialValues={{ remember: true, castTime: 0.5 }}
        onFinish={onFinish}
        autoComplete="off"
        layout="horizontal"
        style={{ maxWidth: '400px' }}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <Form.Item
          label="Function Name"
          name="name"
        >
          <Input type="text" name="name" />
        </Form.Item>
        <Form.Item
          label="Key Sets"
          name="keySets"
        >
          <Input type="text" name="keySets" />
        </Form.Item>
        <Form.Item
          label="Repeat Interval"
          name="interval"
        >
          <Input type="number" name="interval" suffix="seconds" />
        </Form.Item>
        <Form.Item
          label="CastTime"
          name="castTime"
        >
          <Input type="number" name="castTime" suffix="seconds" />
        </Form.Item>
        <Form.Item style={{ justifyContent: 'right' }}>
          <Button htmlType="submit" type="ghost" block>Create Task</Button>
        </Form.Item>
      </Form>
    </section>
  )
}
const LaunchSession: React.FC<{ session: SessionType, onClickLaunch: () => void }> = ({ session, onClickLaunch }) => {
  const { data, mutate } = useSWR(`/api/session?${qs.stringify({ pageId: session.pageId })}`, fetcher)
  const [loading, setLoading] = useState(false)
  if (!data?.page) {
    return (
      <Button size="small" loading={loading} type="primary" onClick={async () => {
        setLoading(true)
        onClickLaunch()
        await new Promise(resolve => setTimeout(resolve, 3000))
        await mutate()
        setLoading(false)
      }}>
        Launch Session
      </Button>
    )
  }
  return <Typography.Text mark italic style={{ color: 'green' }}>{data.page}</Typography.Text>
}
const CreateAutoBuff: React.FC<any> = ({ session }) => {
  const [state, setState] = useRecoilState(taskState)
  const { currentSession, currentSessionIndex } = useMemo(() => {
    const index = state.session.findIndex(s => s.macroId === session.macroId)
    return {
      currentSession: state.session[index],
      currentSessionIndex: index,
    }
  }, [state, session])
  const [form] = useForm()
  const onFinish = (values: any) => {
    setState({
      ...state,
      session: [
        ...state.session.slice(0, currentSessionIndex),
        {
          ...state.session[currentSessionIndex],
          autoBuffTask: values,
        },
        ...state.session.slice(currentSessionIndex + 1),
      ],
    })
    // form.resetFields()
  }
  return (
    <section style={{ textAlign: 'left' }}>
      <div>
        <Typography.Paragraph code>
          You can split keypress with "," eg: 1,2,3,4,5,6,7,8,9,0,Alt 1,Alt 2,Alt 3,KeyZ
        </Typography.Paragraph>
      </div>
      <Form
        form={form}
        initialValues={currentSession.autoBuffTask || { remember: true, castTime: 1.4, mainPlayerPos: 1 }}
        onFinish={onFinish}
        autoComplete="off"
        layout="horizontal"
        style={{ maxWidth: '600px' }}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <Form.Item
          label="Auto-Buff repeat Interval"
          name="interval"
        >
          <Input type="number" name="interval" suffix="seconds" />
        </Form.Item>
        <Form.Item
          label="CastTime"
          name="castTime"
        >
          <Input type="number" name="castTime" suffix="seconds" />
        </Form.Item>
        <Form.Item
          label="Main character party position"
          name="mainPlayerPos"
        >
          <Select defaultValue="1" style={{ width: 120 }}>
            {times(8, (n: number) => (
              <Option value={n + 1}>{n + 1}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Your main char buff keySets"
          name="mainPlayerKeySets"
        >
          <Input type="text" name="buffPlayerKeySets" placeholder="eg: 1,2,3,4,5,6,7" />
        </Form.Item>
        <Form.Item
          label="Your Ringmaster buff keySets"
          name="buffPlayerKeySets"
        >
          <Input type="text" name="buffPlayerKeySets" placeholder="eg: KeyC" />
        </Form.Item>
        <Form.Item style={{ justifyContent: 'right' }}>
          <Button htmlType="submit" type="ghost" block>Update Auto Buff Profile</Button>
        </Form.Item>
      </Form>
    </section>
  )
}
const TaskItem: React.FC<{
  session: SessionType,
  task: TaskType,
  onClickRemove: (args: any) => void
}> = (props) => {
  const [action, setAction] = useState(false)
  const msInterval = props.task.interval * 1000
  useInterval(() => {
    if (action) {
      axios.post(`/api/tasks`, {
        task: props.task,
        pageId: props.session.pageId,
      })
    }
  }, msInterval)
  const onClickStop = () => {
    setAction(false)
  }
  const onClickPlay = () => {
    setAction(true)
  }
  return (
    <div className="flex gap-4 items-center">
      {action ? <Button type="text" onClick={onClickStop} size="small" danger icon={<PauseOutlined />}>
        Pause
      </Button> : <Button type="text" size="small" onClick={onClickPlay} icon={<PlayCircleOutlined />}>Run</Button>}
      [<Typography.Text mark>{props.task.name}</Typography.Text>] :
      <Typography.Text>Press </Typography.Text>
      <Typography.Text>{props.task.keySets}</Typography.Text>
      <Typography.Text>every {props.task.interval} seconds</Typography.Text>
      <Button size="small"
              onClick={() => props.onClickRemove({ session: props.session, task: props.task })}>Remove</Button>
    </div>
  )
}

const AutoBuffTaskItem: React.FC<{
  session: SessionType,
  autoBuff: SessionType['autoBuffTask'],
  onClickRemove: (args: any) => void
}> = (props) => {
  const [action, setAction] = useState(false)
  const msInterval = (props?.autoBuff?.interval || 600) * 1000
  useInterval(() => {
    if (action && props.session.pageId) {
      axios.post(`/api/auto-buff`, {
        pageId: props.session.pageId,
        ...props.autoBuff,
        castTime: (props.autoBuff?.castTime || 0) * 1000,
      })
    }
  }, Number(msInterval))
  const onClickStop = () => {
    setAction(false)
  }
  const onClickPlay = () => {
    setAction(true)
  }
  return (
    <div className="flex gap-4 items-center">
      <div style={{ textAlign: 'left', border: '1px solid #E0E0E0', padding: '1em', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: '12px' }}>
          <div>
            {action ? <Button type="text" onClick={onClickStop} size="small" danger icon={<PauseOutlined />}>
                Pause
              </Button> :
              <Button type="text" size="small" onClick={onClickPlay} icon={<PlayCircleOutlined />}>Run</Button>}
          </div>
          <div>
            <Typography.Text>This task will run every {props.autoBuff?.interval || '-'} seconds</Typography.Text><br />
            <Typography.Text>Your Ringmaster estimate cast
              time {props.autoBuff?.castTime || '-'} seconds</Typography.Text>
          </div>
          <div>
            <Button size="small"
                    onClick={() => props.onClickRemove({ session: props.session })}>Remove</Button>
          </div>
        </div>
        <Divider />

        Buff to main character at party position : [<Typography.Text
        mark>{props.autoBuff?.mainPlayerPos || '-'}</Typography.Text>]
        <br />
        <Typography.Text>with key sets : <Typography.Text
          code>{props.autoBuff?.mainPlayerKeySets}</Typography.Text></Typography.Text>
        <Divider />
        Buff your self
        <br />
        <Typography.Text>with key sets : <Typography.Text
          code>{props.autoBuff?.buffPlayerKeySets}</Typography.Text></Typography.Text>
      </div>
    </div>
  )
}
const TaskContainers = () => {
  const [state, setState] = useRecoilState<TaskStateType>(taskState)
  const { data, error } = useSWR('/api/check', fetcher)
  const isLoading = !error && !data
  if (isLoading) {
    return (<p>Loading....</p>)
  }
  const handleClickCreateMacro = () => {
    setState({
      ...state,
      session: [
        ...state.session,
        {
          tasks: [],
          pageId: null,
          macroId: nanoid(),
          autoBuffTask: null,
        },
      ],
    })
  }
  const handleClickLaunchGame = async (marcoId: string) => {
    const currentSessionIndex = state.session.findIndex(s => s.macroId === marcoId)
    const { data } = await axios.post(`/api/launch`, {})
    setState({
      ...state,
      session: [
        ...state.session.slice(0, currentSessionIndex),
        {
          ...state.session[currentSessionIndex],
          pageId: data.page,
        },
        ...state.session.slice(currentSessionIndex + 1),
      ],
    })
  }
  const handleClickRemoveMarco = (marcoId: string) => {
    Modal.confirm({
      title: 'Confirm',
      content: 'Are you sure you want to remove ?',
      okText: 'Remove',
      cancelText: 'Close',
      onOk: () => {
        setState({
          ...state,
          session: state.session.filter((session) => session.macroId !== marcoId),
        })
      },
    })
  }
  const handleClickRemoveTask = (args: any) => {
    const { session, task } = args
    const currentSessionIndex = state.session.findIndex(s => s.macroId === session.macroId)
    setState({
      ...state,
      session: [
        ...state.session.slice(0, currentSessionIndex),
        {
          ...state.session[currentSessionIndex],
          tasks: state.session[currentSessionIndex].tasks.filter(t => t.id !== task.id),
        },
        ...state.session.slice(currentSessionIndex + 1),
      ],
    })
  }
  const handleClickRemoveAutoBuff = (args: any) => {
    const { session, task } = args
    const currentSessionIndex = state.session.findIndex(s => s.macroId === session.macroId)
    setState({
      ...state,
      session: [
        ...state.session.slice(0, currentSessionIndex),
        {
          ...state.session[currentSessionIndex],
          autoBuffTask: null,
        },
        ...state.session.slice(currentSessionIndex + 1),
      ],
    })
  }
  return (
    <div className="App my-0 mx-auto p-8">
      {state.session.map((session, j: number) => {
        return (
          <div key={j} style={{ border: '1px solid #cecece', margin: '1em 0', padding: '1rem', borderRadius: '6px' }}>
            <div style={{ textAlign: 'left', position: 'relative' }}>
              <div>
                PAGE ID :
                <LaunchSession session={session} onClickLaunch={() => handleClickLaunchGame(session.macroId)} />
              </div>
              <h1 style={{ textAlign: 'left' }}>MARCO ID : {session.macroId}</h1>
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <Button onClick={() => handleClickRemoveMarco(session.macroId)} type="text" danger>Remove Marco</Button>
              </div>
            </div>
            <Divider />
            <Typography.Title>
              Auto Press
            </Typography.Title>
            <Row gutter={12}>
              <Col span={12}>
                <CreateTaskItem session={session} />
              </Col>
              <Col span={12}>
                <List
                  header={false}
                  footer={false}
                  bordered
                  dataSource={session.tasks}
                  renderItem={item => (
                    <List.Item>
                      <TaskItem task={item} session={session} onClickRemove={handleClickRemoveTask} />
                    </List.Item>
                  )}
                  locale={{
                    emptyText: 'Empty task settings.',
                  }}
                />
              </Col>
            </Row>
            <Divider />
            <Typography.Title>
              Auto Buff
            </Typography.Title>
            <Row gutter={12}>
              <Col span={12}>
                <CreateAutoBuff session={session} />
              </Col>
              <Col span={12}>
                {session.autoBuffTask && (
                  <AutoBuffTaskItem session={session} autoBuff={session.autoBuffTask}
                                    onClickRemove={handleClickRemoveAutoBuff} />
                )}
              </Col>
            </Row>
          </div>
        )
      })}
      {!state.session.length && <Typography.Title level={1}>No Marco settings found</Typography.Title>}
      <br />
      <Button onClick={handleClickCreateMacro} size="large" block type="dashed">Create a Macro</Button>
    </div>
  )
}
export default TaskContainers
