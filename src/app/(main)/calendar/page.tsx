"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Row, 
  Column, 
  Text, 
  Heading, 
  Button, 
  Icon, 
  Dialog, 
  Input, 
  Textarea, 
  Grid, 
  Chip, 
  Flex, 
  useToast,
  Tag,
  Select,
  Badge,
  Checkbox,
  Spinner
} from "@/once-ui/components";
import { useUser } from "@/libs/auth/client";
import { redirect } from "next/navigation";
import { useUpcomingEvents } from "./queries";
import type { CalendarEvent } from "./types";

// Event options
const EVENT_OPTIONS = {
  categories: [
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
    { value: "social", label: "Social" }
  ],
  colors: [
    { value: "brand", label: "Blue" },
    { value: "success", label: "Green" },
    { value: "danger", label: "Red" },
    { value: "warning", label: "Yellow" }
  ],
  priorities: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" }
  ]
};

export default function CalendarPage() {
  // Auth check
  const { user, isLoading: isAuthLoading } = useUser();
  const { addToast } = useToast();
  
  if (!isAuthLoading && !user) {
    redirect("/login");
  }

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventColor, setEventColor] = useState("brand");
  const [eventCategory, setEventCategory] = useState("work");
  const [eventPriority, setEventPriority] = useState<string>("medium");
  const [isDeadline, setIsDeadline] = useState(false);
  const [isOptional, setIsOptional] = useState(false);

  // Fetch AI-derived events 
  const { 
    data: aiEvents = [], 
    isLoading: isLoadingEvents,
    refetch: refetchEvents
  } = useUpcomingEvents(user?.id || "");

  // Combine AI events with manually created events
  useEffect(() => {
    if (aiEvents && aiEvents.length > 0) {
      // Only set events if we don't already have user-created events
      // or if we need to combine with existing events
      setEvents(prevEvents => {
        // Keep only user-created events, remove AI events
        const userEvents = prevEvents.filter(e => e.sourceType === 'user');
        // Add all AI events
        return [...userEvents, ...aiEvents];
      });
    }
  }, [aiEvents]);

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day and days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create array for all days to display
    const days = [];
    
    // Add previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - firstDay + i + 1),
        isCurrentMonth: false,
        day: prevMonthDays - firstDay + i + 1
      });
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        day: i
      });
    }
    
    // Add next month days to fill grid (always show 6 rows)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        day: i
      });
    }
    
    return days;
  }, [currentDate]);
  
  // Event handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleCreateEvent = () => {
    if (!eventTitle) {
      addToast({
        variant: "danger",
        message: "Title is required"
      });
      return;
    }
    
    const newEvent: CalendarEvent = {
      id: `user-${Date.now()}`,
      title: eventTitle,
      description: eventDescription,
      date: eventDate,
      color: eventColor,
      category: eventCategory,
      priority: eventPriority as "low" | "medium" | "high" | "urgent",
      isDeadline,
      isOptional,
      sourceType: "user"
    };
    
    setEvents(prev => [...prev, newEvent]);
    resetForm();
    setIsCreateOpen(false);
    
    addToast({
      variant: "success",
      message: "Event added"
    });
  };
  
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    // Only allow deletion of user-created events
    if (selectedEvent.sourceType === "ai") {
      addToast({
        variant: "success",
        message: "AI-detected events cannot be deleted directly. They're based on your emails."
      });
      setIsDetailsOpen(false);
      return;
    }
    
    // First update the events array
    setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
    
    // Then close the dialog
    setIsDetailsOpen(false);
    
    // Then clear the selected event - after a short delay
    setTimeout(() => {
      setSelectedEvent(null);
    }, 100);
    
    addToast({
      variant: "success",
      message: "Event deleted"
    });
  };
  
  const resetForm = () => {
    setEventTitle("");
    setEventDescription("");
    setEventDate(new Date());
    setEventColor("brand");
    setEventCategory("work");
    setEventPriority("medium");
    setIsDeadline(false);
    setIsOptional(false);
  };
  
  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      event.date.getFullYear() === date.getFullYear() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getDate() === date.getDate()
    );
  };
  
  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };
  
  // Load events (manual example events)
  const loadDemoEvents = () => {
    if (!user) return;
    
    // Sample manually created events
    const demoEvents: CalendarEvent[] = [
      {
        id: "user-1",
        title: "Team Sync",
        description: "Weekly team meeting",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2),
        color: "brand",
        category: "work",
        priority: "medium",
        sourceType: "user"
      },
      {
        id: "user-2",
        title: "Lunch with Alex",
        description: "Discuss project collaboration",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 5),
        color: "success",
        category: "personal",
        priority: "low",
        isOptional: true,
        sourceType: "user"
      }
    ];
    
    // Keep AI events, replace user events
    setEvents(prevEvents => {
      const aiEvents = prevEvents.filter(e => e.sourceType === 'ai');
      return [...aiEvents, ...demoEvents];
    });
    
    addToast({
      variant: "success",
      message: "Demo events loaded"
    });
  };
  
  // Get priority badge variant
  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    switch (priority) {
      case "urgent":
        return <Tag label="Urgent" variant="danger" />;
      case "high":
        return <Tag label="High" variant="warning" />;
      case "medium":
        return <Tag label="Medium" variant="success" />;
      case "low":
        return <Tag label="Low" variant="info" />;
      default:
        return null;
    }
  };
  
  // Get source type badge
  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case "ai":
        return <Tag label="AI Detected" variant="neutral" />;
      case "user":
        return <Tag label="Manual" variant="neutral" />;
      default:
        return null;
    }
  };
  
  return (
    <Column fillWidth>
      {/* Header with month and controls */}
      <Row 
        horizontal="space-between" 
        vertical="center" 
        padding="24" 
        gap="16"
        fillWidth
      >
        <Heading variant="display-strong-l">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Heading>
        
        <Row gap="8">
          <Button variant="secondary" size="s" label="Today" onClick={handleToday} />
          <Button variant="secondary" size="s" label="Load Demo Events" onClick={loadDemoEvents} />
          <Button 
            variant="tertiary" 
            size="s" 
            onClick={() => refetchEvents()} 
            prefixIcon={isLoadingEvents ? "spinner" : "refresh"}
            disabled={isLoadingEvents}
            aria-label="Refresh" 
          />
          <Button variant="tertiary" size="s" onClick={handlePrevMonth} aria-label="Previous">
            <Icon name="chevronLeft" size="s" />
          </Button>
          <Button variant="tertiary" size="s" onClick={handleNextMonth} aria-label="Next">
            <Icon name="chevronRight" size="s" />
          </Button>
          <Button variant="primary" label="Add Event" onClick={() => setIsCreateOpen(true)}>
            <Icon name="plus" size="s" />
          </Button>
        </Row>
      </Row>
      
      {/* Loading state */}
      {isLoadingEvents && (
        <Row horizontal="center" padding="24">
          <Spinner size="m" />
          <Text>Loading events...</Text>
        </Row>
      )}
      
      {/* Day labels */}
      <Grid columns={7} gap="0" fillWidth paddingX="24">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Flex key={day} horizontal="center" paddingY="12" border="neutral-alpha-weak" borderWidth={1}>
            <Text variant="label-strong-m">{day}</Text>
          </Flex>
        ))}
      </Grid>
      
      {/* Calendar grid */}
      <Grid columns={7} gap="0" fillWidth paddingX="24" paddingBottom="24">
        {calendarDays.map(dayInfo => {
          const dayKey = `${dayInfo.date.getFullYear()}-${dayInfo.date.getMonth()}-${dayInfo.date.getDate()}`;
          const dayEvents = getEventsForDay(dayInfo.date);
          const currentDay = isToday(dayInfo.date);
          
          // Sort events by priority
          const sortedEvents = [...dayEvents].sort((a, b) => {
            const priorityOrder = { "urgent": 0, "high": 1, "medium": 2, "low": 3 };
            const aPriority = a.priority ? priorityOrder[a.priority] : 4;
            const bPriority = b.priority ? priorityOrder[b.priority] : 4;
            return aPriority - bPriority;
          });
          
          return (
            <Flex 
              key={dayKey}
              direction="column"
              padding="8"
              border="neutral-alpha-weak"
              borderWidth={1}
              style={{ minHeight: "100px" }}
              background={dayInfo.isCurrentMonth ? "surface" : "neutral-alpha-weak"}
            >
              {/* Day number */}
              <Flex horizontal="space-between" vertical="center" paddingBottom="8">
                <Chip
                  label={dayInfo.day.toString()}
                  selected={currentDay}
                  className={
                    currentDay 
                      ? "radius-full background-brand-solid-medium color-static-white"
                      : !dayInfo.isCurrentMonth ? "color-neutral-medium" : ""
                  }
                />
                <Button
                  variant="tertiary"
                  size="s"
                  aria-label="Add event"
                  onClick={() => {
                    setEventDate(dayInfo.date);
                    setIsCreateOpen(true);
                  }}
                >
                  <Icon name="plus" size="s" />
                </Button>
              </Flex>
              
              {/* Events */}
              <Column gap="4">
                {sortedEvents.map(event => (
                  <Flex 
                    key={event.id} 
                    horizontal="space-between"
                    vertical="center"
                    gap="4"
                  >
                    <Chip
                      label={event.title}
                      selected={true}
                      className={`background-${event.color}-solid-weak color-${event.color}-on-background-strong ${event.isDeadline ? 'border-danger-solid-strong border-width-2' : ''}`}
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsDetailsOpen(true);
                      }}
                    />
                    {event.sourceType === "ai" && (
                      <Icon name="sparkles" size="xs" color={event.color} />
                    )}
                    {event.isDeadline && (
                      <Icon name="alert" size="xs" color="danger" />
                    )}
                  </Flex>
                ))}
              </Column>
            </Flex>
          );
        })}
      </Grid>
      
      {/* Create Event Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Add Event"
      >
        <Column gap="16" paddingY="16">
          <Input
            id="event-title"
            label="Title"
            value={eventTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventTitle(e.target.value)}
            required
          />
          
          <Textarea
            id="event-description"
            label="Description"
            value={eventDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEventDescription(e.target.value)}
          />
          
          <Row gap="16">
            <Column fillWidth>
              <Select
                id="event-category"
                label="Category"
                options={EVENT_OPTIONS.categories}
                value={eventCategory}
                onChange={(value: any) => {
                  if (typeof value === 'string') setEventCategory(value);
                }}
              />
            </Column>
            
            <Column fillWidth>
              <Select
                id="event-color"
                label="Color"
                options={EVENT_OPTIONS.colors}
                value={eventColor}
                onChange={(value: any) => {
                  if (typeof value === 'string') setEventColor(value);
                }}
              />
            </Column>
          </Row>
          
          <Select
            id="event-priority"
            label="Priority"
            options={EVENT_OPTIONS.priorities}
            value={eventPriority}
            onChange={(value: any) => {
              if (typeof value === 'string') setEventPriority(value);
            }}
          />
          
          <Row gap="16">
            <Flex gap="8" vertical="center">
              <Checkbox
                id="is-deadline"
                checked={isDeadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDeadline(e.target.checked)}
                label="Deadline"
              />
            </Flex>
            
            <Flex gap="8" vertical="center">
              <Checkbox
                id="is-optional"
                checked={isOptional}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsOptional(e.target.checked)}
                label="Optional"
              />
            </Flex>
          </Row>
        </Column>
        
        <Row horizontal="end" gap="16" paddingTop="16">
          <Button
            variant="tertiary"
            label="Cancel"
            onClick={() => {
              setIsCreateOpen(false);
              resetForm();
            }}
          />
          <Button variant="primary" label="Create" onClick={handleCreateEvent} />
        </Row>
      </Dialog>
      
      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={selectedEvent.title}
        >
          <Column gap="16" paddingY="16">
            <Row vertical="center" gap="8">
              <Icon name="calendar" size="s" />
              <Text variant="body-default-m">
                {selectedEvent.date.toLocaleDateString()}
              </Text>
            </Row>
            
            <Row gap="8" fillWidth>
              <Tag
                label={selectedEvent.category}
                variant="neutral"
              />
              
              {selectedEvent.priority && getPriorityBadge(selectedEvent.priority)}
              
              {selectedEvent.isDeadline && (
                <Tag label="Deadline" variant="danger" />
              )}
              
              {selectedEvent.isOptional && (
                <Tag label="Optional" variant="neutral" />
              )}
              
              {getSourceBadge(selectedEvent.sourceType)}
            </Row>
            
            {selectedEvent.description && (
              <Text variant="body-default-m">{selectedEvent.description}</Text>
            )}
            
            {selectedEvent.emailId && (
              <Row gap="8" vertical="center">
                <Icon name="mail" size="s" />
                <Button
                  variant="tertiary"
                  size="s"
                  label="View Source Email"
                  href={`/inbox/email/${selectedEvent.emailId}`}
                />
              </Row>
            )}
          </Column>
          
          <Row horizontal="end" gap="16" paddingTop="16">
            {selectedEvent.sourceType === "user" && (
              <Button
                variant="danger"
                label="Delete"
                onClick={handleDeleteEvent}
              />
            )}
            <Button
              variant="primary"
              label="Close"
              onClick={() => setIsDetailsOpen(false)}
            />
          </Row>
        </Dialog>
      )}
    </Column>
  );
} 