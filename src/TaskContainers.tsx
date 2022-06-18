import useSWR from 'swr'
import axios from 'axios'
import { useRecoilState } from 'recoil'
import { Button, Form, Input } from 'antd'
import taskState, { TaskStateType } from './recoil/task-state'
import { useForm } from 'antd/es/form/Form'
import { nanoid } from 'nanoid'
import { useInterval } from 'beautiful-react-hooks'
import { useState } from 'react'

const fetcher = (url: string) => axios.get(url).then(res => res.data)

const CreateTaskItem: React.FC = () => {
  const [state, setState] = useRecoilState(taskState)
  const [form] = useForm()
  const onFinish = (values: any) => {
    setState({
      ...state,
      tasks: [
        ...state.tasks,
        {
          id: nanoid(),
          ...values,
        },
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
      layout="vertical"
      style={{ maxWidth: '400px' }}
    >
      <Form.Item
        label="name"
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
        <Input type="number" name="interval" />
      </Form.Item>
      <div>
        <Button htmlType="submit">Create Task</Button>
      </div>
    </Form>
  )
}
const TaskItem: React.FC<TaskStateType['tasks'][0]> = ({ id, name, keySets, interval }) => {
  const [state, setState] = useRecoilState(taskState)
  const [action, setAction] = useState(false)
  const runTask = () => {
    axios.post('/api/tasks', {
      keySets,
    })
  }
  useInterval(() => {
    if (action) {
      runTask()
    }
  }, +interval)
  const onClickRemove = () => {
    setState({
      ...state,
      tasks: state.tasks.filter(t => t.id !== id),
    })
  }
  const onClickStop = () => {
    setAction(false)
  }
  const onClickPlay = () => {
    setAction(true)
  }
  return (
    <div className="flex gap-4 items-center">
      <p>{name} | {keySets} | {interval}</p>
      {action ? (
        <Button onClick={onClickStop} danger>Stop</Button>
      ) : (
        <Button onClick={onClickPlay} type="primary">Play</Button>
      )}
      <Button onClick={onClickRemove}>Remove</Button>
    </div>
  )
}
const TaskContainers = () => {
  const [state] = useRecoilState<TaskStateType>(taskState)
  const { data, error } = useSWR('/api/check', fetcher)
  const isLoading = !error && !data
  if (isLoading) {
    return (<p>Loading....</p>)
  }
  const handleClickLaunchGame = () => {
    axios.post('/api/launch', {}).then(response => {
    })
  }

  const handleClickCloseGame = () => {
    axios.delete('/api/launch', {}).then(response => {
    })
  }

  return (
    <div className="App container my-0 mx-auto p-8">
      {state.tasks.map((t: TaskStateType['tasks'][0], i: number) => {
        return (
          <TaskItem key={i} {...t} />
        )
      })}
      <CreateTaskItem />
      <Button onClick={handleClickLaunchGame}>Launch Game</Button>
      <Button onClick={handleClickCloseGame}>Close Game</Button>
    </div>
  )
}
export default TaskContainers
