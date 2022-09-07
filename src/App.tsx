import React, {useEffect, useState} from 'react';
import {Button, Container, Box, Card, CardHeader, CardContent, CardActions, Typography, Link} from "@mui/material";
import {v4 as uuid} from "uuid";
import {useDrop, useDrag, DndProvider} from "react-dnd";
import type {Identifier, XYCoord} from 'dnd-core'
import {HTML5Backend} from "react-dnd-html5-backend";
import "./App.css";

type Item = {
    id: string;
    name: string;
}
type ItemList = Item[];

function createItem(name: string) {
    return {
        id: uuid(),
        name: name
    }
}

function createItemList(count: number, prefix: string = ""): ItemList {
    const itemList: ItemList = [];
    for (let i = 0; i < count; i++) {
        itemList.push(createItem(`${prefix} Item ${i}`));
    }
    return itemList;
}

const TempCard = (props: { onDropped: Function }) => {
    // const [_, drop] = useDrop({
    //     accept: "item",
    //     drop: (item: Item) => {
    //         // if (data.id !== "temp")
    //         props.onDropped(item);
    //         // onDropped(item);
    //     },
    // });
    return <Box  component={"div"} p={2} flexGrow={1}>
        <Card variant={"outlined"} className={"active-animatioon"} sx={{
            border: "0px dashed #000",
            opacity: 0.5,
        }}>
            <CardHeader/>
            <CardContent>
                <Typography variant="body2" color="text.secondary">
                    {/*{isDragging && <div>Dragging</div>}*/}
                    {/*{isOver && <div>Over</div>}*/}
                </Typography>
            </CardContent>
        </Card>
    </Box>
}

// const data: { [key: string]: ItemList } = {
//     list1: createItemList(3, "l1"),
//     list2: createItemList(3, "l2"),
//     list3: createItemList(3, "l3"),
// }
function ListItem(props: { data: Item, moveItem: (orig: Item, dest: Item, isAfter: boolean) => void }) {
    const {data, moveItem} = props;
    const ref = React.useRef<HTMLDivElement>(null);
    const [dragDirection, setDragDirection] = useState<"up" | "down">("up");
    const onDropped = (item: Item) => {
        const isAfter = dragDirection === "down";

        moveItem(item, data, isAfter);
    }

    const [{isOver}, drop] = useDrop({
        accept: "item",
        drop: (item: Item) => {
            // if (data.id !== "temp")
            onDropped(item);
            // removeTemp(item);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            handlerId: monitor.getHandlerId(),
        }),
        hover: (item: Item, monitor) => {

            if (!ref.current) {
                return;
            }
            const dragIndex = item.id;
            const hoverIndex = data.id;
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (hoverClientY < hoverMiddleY) {
                setDragDirection("up");
                // addTemp(data, false);
                return;
            }
            // Dragging upwards
            if (hoverClientY > hoverMiddleY) {
                setDragDirection("down");
                // addTemp(data, true);
                return;
            }
            // Time to actually perform the action
            // moveItem(item, data, true);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            // item.id = hoverIndex;
        }

    });

    const [{isDragging, handlerId}, drag] = useDrag({
        item: data,
        type: "item",
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            handlerId: monitor.getHandlerId(),
        }),

    });

    const opacity = isDragging ? 0.4 : 1;
    drag(drop(ref));
    let component = <React.Fragment/>
    if (isOver) {
        component = <TempCard onDropped={onDropped}/>

    }
    // drag(ref);
    return <div ref={ref}>
        <Box display={isDragging ? "none" : "block"} sx={{opacity}} component={"div"} p={2} flexGrow={1}>
            {dragDirection === "up" && component}
            <Card variant={"outlined"}>
                <CardHeader title={data.name}/>
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        List Item Content
                        {/*{ isDragging && <div>Dragging</div>}*/}
                        {/*{isOver && <div>Over</div>}*/}
                    </Typography>
                </CardContent>
            </Card>
            {dragDirection === "down" && component}

        </Box>
    </div>
}

type ItemGroupKey = keyof typeof defaultData;

function ListContainer(props: { data: typeof defaultData, group: ItemGroupKey, moveToList: (item: Item, list: ItemGroupKey) => void, moveItem: (orig: Item, dest: Item, isAfter: boolean) => void }) {
    const {data: src, group, moveItem, moveToList} = props;
    const data = src[group];
    const [_, drop] = useDrop({
        accept: "item",
        drop: (item: Item) => {
            moveToList(item, group);
        },
        hover: (item: Item, monitor) => {
            if (data.length === 0) {
                //TODO: show temp card
                // addTemp(group, false);
            }
        }
    });
    return <Box p={2} flexGrow={1}>
        <Card>
            <CardHeader ref={drop} title="List Container"/>
            <CardContent>
                {data.map((item) => <ListItem key={item.id} data={item} moveItem={moveItem}/>)}

            </CardContent>
        </Card>
    </Box>
}

const TempItem = {
    id: "temp",
    name: "temp"
}
const defaultData = {
    list1: createItemList(3, "l1"),
    list2: createItemList(3, "l2"),
    list3: createItemList(3, "l3"),
}

export default function App() {
    const [data, setData] = useState(defaultData);

    function getListFromItem(item: Item): [data: ItemList, key: ItemGroupKey, found: boolean] {
        for (let key in data) {
            // data.
            const list = data[key as ItemGroupKey];
            if (list.some((i) => i.id === item.id)) {
                return [list, key as ItemGroupKey, true];
            }
        }
        return [[], "list1", false];
    }

    function addTempItem(list: ItemList, index: number) {
        // const newList = [...list].slice(0, index).concat(TempItem).concat(list.slice(index));
        // newList.splice(index, 0, TempItem);
        return [...list].slice(0, index).concat(TempItem).concat(list.slice(index));
    }

    function removeTempItem() {
        setData((data) => {
            const newData = {...data};
            for (let key in newData) {
                const list = newData[key as keyof typeof newData];
                const index = list.findIndex((item) => item.id === TempItem.id);
                if (index >= 0) {
                    const newList = [...list];
                    newList.splice(index, 1);
                    newData[key as keyof typeof newData] = newList;
                }
            }
            return newData;
        });
    }

    const onDropItem = (item?: Item) => {
        if (item) {
            let [_, key, found] = getListFromItem(item);
            if (!found) return;
            //remove item from old list
            setData((data) => ({
                ...data,
                [key]: data[key].filter((i) => i.id !== item.id)
            }));
            //replace temp with item
            setData((data) => {
                const newData = {...data};

                for (let key in newData) {
                    const list = newData[key as keyof typeof newData];
                    const index = list.findIndex((i) => i.id === TempItem.id);
                    if (index >= 0) {
                        const newList = [...list];
                        newList.splice(index, 1, item);
                        newData[key as keyof typeof newData] = newList;
                    }
                }

                return newData;
            });
            //move item to temp
        } else {
            // do nothing
            removeTempItem();
        }
    }
    const moveItem = (orig: Item, dest: Item, isAfter: boolean) => {
        if (orig.id === dest.id) return;
        let [__, origKey, origFound] = getListFromItem(orig);
        let [_, destKey, destFound] = getListFromItem(dest);
        if (!origFound || !destFound) return;
        setData((data) => {
            const newData = {...data};
            const origList = newData[origKey];
            const destList = newData[destKey];
            const origIndex = origList.findIndex((i) => i.id === orig.id);
            const destIndex = destList.findIndex((i) => i.id === dest.id);
            if (origKey === destKey) {
                //move in same list

                const newList = [...origList];
                newList.splice(origIndex, 1);
                newList.splice(destIndex + (isAfter ? 1 : 0), 0, orig);
                newData[origKey] = newList;
            } else {
                //move to different list
                const newOrigList = origList.filter((i) => i.id !== orig.id);
                newData[origKey] = newOrigList;
                const newDestList = [...destList];
                newDestList.splice(destIndex + (isAfter ? 1 : 0), 0, orig);
                console.log({newDestList, orig, dest, isAfter, destIndex});
                newData[destKey] = newDestList;
            }
            return newData;
        });
    }

    function moveToList(item: Item, list: ItemGroupKey) {
        if (!item || !list) return;
        let [_, key, found] = getListFromItem(item);
        if (!found)
            return;
        //remove item from old list
        setData((data) => ({
            ...data,
            [key]: data[key].filter((i) => i.id !== item.id)
        }));
        setData((data) => {
            return {
                ...data,
                [list]: [...data[list], item]
            };
        });
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <Container>
                <Box sx={{my: 4}}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Create React App example
                    </Typography>
                    <Box display={"flex"} flexDirection={"row"} flexWrap={"wrap"}>
                        {Object.keys(data).map((key) => {
                            return <ListContainer key={key} data={data} group={key as any} moveItem={moveItem} moveToList={moveToList}/>
                        })}
                    </Box>
                    {/*<ProTip />*/}
                </Box>
            </Container>
        </DndProvider>
    );
}
// function App() {
//     return (
//         <Container className="App">
//             <Box m={3} display={"flex"} flexDirection={"row"}>
//                 <ListContainer/>
//                 <ListContainer/>
//                 <ListContainer/>
//             </Box>
//         </Container>
//     );
// }

// export default App;
