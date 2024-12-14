import React, { useState } from "react";
import Timeline from "react-calendar-timeline";
import moment from "moment";
import {
  Box,
  Button,
  ButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import "react-calendar-timeline/styles.css";
import USERS_DATA from "../Common/users.json";
import TIMELINE_DATA from "../Common/data.json";
import { v4 as uuidv4 } from "uuid";
import ArrowForIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import "./style.css";

const TimelineChartComponent = () => {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("md"));

  const groups = [
    { id: 1, title: "Layers" },
    { id: 2, title: "Layer 1" },
    { id: 3, title: "Layer 2" },
    { id: 4, title: "" },
    { id: 5, title: "Override Layer" },
    { id: 6, title: "" },
    { id: 7, title: "Final Schedule" },
  ];

  const [view, setView] = useState("month");
  const getUserName = (userId) => {
    const user = USERS_DATA.users.find((user) => user.id === userId);
    return user ? user.name : "Unknown";
  };

  const getStyle = (userId) => {
    return {
      backgroundColor:
        userId === 24 ? "#083434" : userId === 27 ? "#eb734b" : "#f9b517",
      color: userId === 24 ? "#fff" : userId === 27 ? "#fff" : "#000",
      textAlign: "center",
      border:
        userId === 24
          ? "1px solid #083434"
          : userId === 27
          ? "1px solid #eb734b"
          : "1px solid #f9b517",
    };
  };

  // data is formatted but when user present in one row... so make that as a single entry
  const mergeEntries = (data) => {
    // Sort data by group, title, and start_time
    const sortedData = [...data].sort((a, b) => {
      if (a.group !== b.group) return a.group - b.group;
      if (a.title !== b.title) return a.title.localeCompare(b.title);
      return new Date(a.start_time) - new Date(b.start_time);
    });

    const mergedData = [];

    sortedData.forEach((current) => {
      const last = mergedData[mergedData.length - 1];
      if (
        last &&
        last.group === current.group &&
        last.title === current.title &&
        new Date(last.end_time).getTime() >=
          new Date(current.start_time).getTime()
      ) {
        // Merge entries by updating the end_time
        last.end_time = new Date(
          Math.max(
            new Date(last.end_time).getTime(),
            new Date(current.end_time).getTime()
          )
        );
      } else {
        mergedData.push({ ...current });
      }
    });

    return mergedData;
  };

  const formattedData = mergeEntries(
    Object.keys(TIMELINE_DATA)
      .map((key) => {
        let data = [];
        if (key === "layers") {
          data = TIMELINE_DATA[key]
            .flatMap((entry) => {
              return Object.keys(entry).map((key2) => {
                if (key2 === "layers") {
                  return entry[key2].map((layerEntry) => ({
                    id: uuidv4(),
                    group: entry.number + 1,
                    title: getUserName(layerEntry.userId),
                    start_time: new Date(layerEntry.startDate),
                    end_time: new Date(layerEntry.endDate),
                    itemProps: {
                      style: {
                        ...getStyle(layerEntry.userId),
                      },
                    },
                  }));
                }
                return [];
              });
            })
            .flat();
        } else {
          return TIMELINE_DATA[key].map((layerEntry) => ({
            id: uuidv4(),
            group: key === "overrideLayer" ? 5 : 7,
            title: getUserName(layerEntry.userId),
            start_time: new Date(layerEntry.startDate),
            end_time: new Date(layerEntry.endDate),
            itemProps: {
              style: {
                ...getStyle(layerEntry.userId),
              },
            },
          }));
        }
        return data;
      })
      .flat()
  );

  const minDate = moment.min(
    formattedData.map((item) => moment(item.start_time))
  );
  const maxDate = moment.max(
    formattedData.map((item) => moment(item.end_time))
  );

  // Initialize the timeline range based on data so data shown as starting date
  /** NOTE: I have set the date range by given data because data is old */
  const [timelineRange, setTimelineRange] = useState({
    start: minDate.clone().subtract(1, "day"),
    end: maxDate.clone().add(1, "day"),
  });

  const handleViewChange = (duration, unit, viewD) => {
    const start = timelineRange.start.clone();
    const newStart = start.clone();
    const newEnd = newStart.clone().add(duration, unit);

    setTimelineRange({ start: newStart, end: newEnd });
    setView(viewD);
  };

  const handleTodayClick = () => {
    const todayStart = moment().startOf("day");
    const duration = moment(timelineRange.end).diff(
      moment(timelineRange.start),
      "days"
    );
    const todayEnd = todayStart.clone().add(duration, "days");

    setTimelineRange({ start: todayStart, end: todayEnd });
  };

  const handleBackwardClick = () => {
    const duration = moment(timelineRange.end).diff(
      moment(timelineRange.start),
      "days"
    );
    const newStart = timelineRange.start.clone().subtract(duration, "days");
    const newEnd = timelineRange.end.clone().subtract(duration, "days");

    setTimelineRange({ start: newStart, end: newEnd });
  };

  const handleForwardClick = () => {
    const duration = moment(timelineRange.end).diff(
      moment(timelineRange.start),
      "days"
    );
    const newStart = timelineRange.start.clone().add(duration, "days");
    const newEnd = timelineRange.end.clone().add(duration, "days");

    setTimelineRange({ start: newStart, end: newEnd });
  };

  const handleTimeChange = (
    visibleTimeStart,
    visibleTimeEnd,
    updateScrollCanvas
  ) => {
    // Dynamically update the timeline range when scrolling
    setTimelineRange({
      start: moment(visibleTimeStart),
      end: moment(visibleTimeEnd),
    });
    updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          marginBottom: 10,
          display: "flex",
          justifyContent: isMobileView ? "center" : "space-between",
          flexWrap: "wrap",
          gap: isMobileView && 2,
        }}
      >
        <Box sx={{ display: "flex", gap: "20px" }}>
          <Button variant="outlined" onClick={() => handleTodayClick()}>
            Today
          </Button>
          <Button variant="outlined" onClick={() => handleBackwardClick()}>
            <ArrowBackIcon />
          </Button>
          <Button variant="outlined" onClick={() => handleForwardClick()}>
            <ArrowForIcon />
          </Button>
        </Box>

        <ButtonGroup variant="outlined" aria-label="timestamp btn group">
          <Button
            onClick={() => handleViewChange(1, "day", "1day")}
            variant={view === "1day" ? "contained" : "outlined"}
          >
            1 Day
          </Button>
          <Button
            onClick={() => handleViewChange(2, "day", "2day")}
            variant={view === "2day" ? "contained" : "outlined"}
          >
            2 Day
          </Button>
          <Button
            onClick={() => handleViewChange(7, "days", "1week")}
            variant={view === "1week" ? "contained" : "outlined"}
          >
            1 Week
          </Button>
          <Button
            onClick={() => handleViewChange(14, "days", "2week")}
            variant={view === "2week" ? "contained" : "outlined"}
          >
            2 Week
          </Button>
          <Button
            onClick={() => handleViewChange(1, "month", "month")}
            variant={view === "month" ? "contained" : "outlined"}
          >
            Month
          </Button>
        </ButtonGroup>
      </Box>

      <Timeline
        groups={groups}
        items={formattedData}
        visibleTimeStart={timelineRange.start.valueOf()}
        visibleTimeEnd={timelineRange.end.valueOf()}
        onTimeChange={handleTimeChange}
        // minZoom={isMobileView ? 3600 * 1000 * 6 : 3600 * 1000 * 24}
        // maxZoom={isMobileView ? 3600 * 1000 * 24 : 3600 * 1000 * 24 * 30}
        // defaultTimeStart={timelineRange.start.valueOf()}
        // defaultTimeEnd={timelineRange.end.valueOf()}
        groupRenderer={({ group }) => (
          <Box sx={{ fontSize: 16, padding: "10px 0" }}>{group.title}</Box>
        )}
        lineHeight={50} // rows height
      />
    </Box>
  );
};

export default TimelineChartComponent;
