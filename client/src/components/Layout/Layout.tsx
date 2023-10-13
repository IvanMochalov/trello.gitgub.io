import React from 'react';
import { Container, Box, Tooltip } from '@mui/material';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Smile } from '../Smile';
import { TBoard, TInitialData, TStep, TTask } from '../../type';
import styles from './layout.module.css';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { initialData } from '../../data/source';
import { DropResult } from 'react-beautiful-dnd';
import { randomId } from '../../utils/getRandomId';
import { instanceOfTBoard } from '../../utils/instanceOfTBoard';
import { instanceOfTTask } from '../../utils/instanceOfTTask';

export const Layout = () => {
  // const [initialValue, setInitialValue] = useLocalStorage<TInitialData | Object>(initialData, 'boardsList')
  const [initialValue, setInitialValue] = useLocalStorage<TInitialData | Object>({ steps: {}, tasks: {}, boards: {}, boardOrder: [] }, 'boardsList')

  const { board_id } = useParams<{ board_id: string }>();
  const currentBoard = initialValue.boards && initialValue.boards[board_id || ''];

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    // console.log('result',result)

    // const step = initialValue.steps[draggableId]
    // console.log('step',step)
    
    // const task = initialValue.tasks[draggableId]
    // console.log('task',task)

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'task') {
      const newTaskIds = Array.from(currentBoard.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newBoard = {
        ...currentBoard,
        taskIds: newTaskIds,
      };

      const newState = {
        ...initialValue,
        boards: {
          ...initialValue.boards,
          [currentBoard.id]: newBoard,
        },
      };

      setInitialValue(newState);
      return;
    }

    const home = initialValue.tasks[source.droppableId];
    const foreign = initialValue.tasks[destination.droppableId];

    if (home === foreign) {
      const newStepIds = Array.from(home.stepIds);
      newStepIds.splice(source.index, 1);
      newStepIds.splice(destination.index, 0, draggableId);
  
      const newTask = {
        ...home,
        stepIds: newStepIds,
      };
  
      const newState = {
        ...initialValue,
        tasks: {
          ...initialValue.tasks,
          [newTask.id]: newTask,
        },
      };
  
      setInitialValue(newState)
      return;
    }

    const homeStepIds = Array.from(home.stepIds);
    homeStepIds.splice(source.index, 1);
    const newHome = {
      ...home,
      stepIds: homeStepIds,
    };

    const foreignStepIds = Array.from(foreign.stepIds);
    foreignStepIds.splice(destination.index, 0, draggableId)
    const newForeign = {
      ...foreign,
      stepIds: foreignStepIds,
    };

    const newState = {
      ...initialValue,
      tasks: {
        ...initialValue.tasks,
        [newHome.id]: newHome,
        [newForeign.id]: newForeign,
      },
    };

    setInitialValue(newState)
  };

  const handleSave = (itemName: string, currentParent?: TBoard | TTask ) => {
    const newId = randomId(10);
    let newState = {};

    if (instanceOfTBoard(currentParent)) {
      const newTask = {
        id: newId,
        title: itemName,
        stepIds: [],
        position: 0,
      };
      newState = {
        ...initialValue,
        tasks: {
          ...initialValue.tasks,
          [newTask.id]: newTask,
        },
        boards: {
          ...initialValue.boards,
          [currentParent.id]: {
            ...currentParent,
            taskIds: [
              newId,
              ...currentParent.taskIds,
            ]
          }
        }
      };
    }

    if (instanceOfTTask(currentParent)) {
      const newStep = {
        id: newId,
        content: itemName,
        position: 0,
      };
  
      newState = {
        ...initialValue,
        steps: {
          ...initialValue.steps,
          [newStep.id]: newStep,
        },
        tasks: {
          ...initialValue.tasks,
          [currentParent.id]: {
            ...currentParent,
            stepIds: [
              newId,
              ...currentParent.stepIds
            ]
          }
        }
      };
    }

    if (currentParent === undefined) {
      const newBoard = {
        id: newId,
        title: itemName,
        taskIds: [],
        position: 0,
      };
      newState = {
        ...initialValue,
        boards: {
          ...initialValue.boards,
          [newBoard.id]: newBoard,
        },
        boardOrder: [
          newId,
          ...initialValue.boardOrder,
        ]
      };
    }

    setInitialValue(newState);
  };

  const handleDelete = (currentItem: TBoard | TTask | TStep, currentParent?: TBoard | TTask) => {
    let newState = {};

    if (instanceOfTBoard(currentItem)) {
      const currentBoard = initialValue.boards[currentItem.id]
  
      currentBoard.taskIds.forEach((taskId: string) => {
        const currentTask = initialValue.tasks[taskId];
  
        currentTask.stepIds.forEach((stepId: string) => {
          delete initialValue.steps[stepId];
        })
  
        delete initialValue.tasks[taskId];
      })
      
      delete initialValue.boards[currentItem.id];
  
      const newBoardOrder = initialValue.boardOrder.filter(function(id: string) {
        return id !== currentItem.id
      })
  
      newState = {
        ...initialValue,
        
        boardOrder: newBoardOrder
      };
    }

    if (instanceOfTTask(currentItem) && currentParent !== undefined) {
      const currentTask = initialValue.tasks[currentItem.id]
      console.log(currentTask)

      currentTask.stepIds.forEach((stepId: string) => {
        delete initialValue.steps[stepId];
      })

      delete initialValue.tasks[currentItem.id];

      const currentBoardTaskIds = initialValue.boards[currentParent.id].taskIds.filter(function(id: string) {
        return id !== currentItem.id
      })

      newState = {
        ...initialValue,
        boards: {
          ...initialValue.boards,
          [currentParent.id]: {
            ...initialValue.boards[currentParent.id],
            taskIds: currentBoardTaskIds
          }
        }
      };
    }


    setInitialValue(newState);
  };

  const handleEditBoard = (itemId: string, newItemName: string) => {
    const currentBoard = initialValue.boards[itemId]

    if (currentBoard.title === newItemName) {
      return
    }
    
    const newBoard = {
      ...currentBoard,
      title: newItemName,
    };

    const newState = {
      ...initialValue,
      boards: {
        ...initialValue.boards,
        [newBoard.id]: newBoard,
      },
    };
    
    setInitialValue(newState);
  }

  return (
    <React.Fragment>
      <Container maxWidth="lg">
        <Box sx={{ height: '100vh' }}>
          <div className={styles.smileWrapper}>
            <Tooltip title="Go to Main">
              <Link to='/boards' tabIndex={-1}>
                <Smile happy={true}/>
              </Link>
            </Tooltip>
          </div>
          <Outlet context={[
            initialValue,
            handleDragEnd,
            handleSave,
            handleDelete,
            handleEditBoard,
          ]}/>
        </Box>
      </Container>
    </React.Fragment>
  )
}