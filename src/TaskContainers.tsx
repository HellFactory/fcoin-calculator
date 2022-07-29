import useSWR, { mutate } from 'swr'
import axios from 'axios'
import { useRecoilState } from 'recoil'
import { Button, Divider, Form, Input, List, Modal, Typography } from 'antd'
import taskState, { SessionType, TaskStateType, TaskType } from './recoil/task-state'
import { useForm } from 'antd/es/form/Form'
import { nanoid } from 'nanoid'
import qs from 'qs'
import { useEffect, useMemo, useState } from 'react'
import { fetcher } from './utils/fetcher'
import { PauseOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useInterval } from 'beautiful-react-hooks'

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
    <Form
      form={form}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      autoComplete="off"
      layout="inline"
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
      <Form.Item>
        <Button htmlType="submit" type="ghost" block>Create Task</Button>
      </Form.Item>
    </Form>
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

  const handleClickCloseGame = () => {
    axios.delete('/api/launch', {}).then(response => {
    })
  }

  return (
    <div className="App container my-0 mx-auto p-8">
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
            <Divider />
            <CreateTaskItem session={session} />
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
