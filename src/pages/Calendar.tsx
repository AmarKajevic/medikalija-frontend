import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "@shared/ui/modal-kit/index";
import { useModal } from "@shared/lib/useModal";
import PageMeta from "@shared/ui/common/PageMeta";
import { api } from "@shared/api/api";

interface CalendarEvent extends EventInput {
  _id?: string;
  extendedProps: {
    calendar: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const calendarsEvents = {
    crvena: "Crvena",
    zelena: "Zelena",
    plava: "Plava",
    narandzasta: "Narandzasta",
  };

  // =======================================
  // 1. UČITAVANJE DOGAĐAJA IZ BACKENDA
  // =======================================
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const res = await api.get("/api/calendar");

        if (res.data.success) {
          const formattedEvents = res.data.events.map((ev: any) => ({
            ...ev,
            id: ev._id,
            title: ev.title,
            start: ev.start,
            end: ev.end,
            extendedProps: { calendar: ev.calendar },
          }));

          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();
  }, []);

  const resetModalFields = () => {
    setSelectedEvent(null);
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
  };

  // =======================================
  // 2. KLIKNUT DATUM → DODAVANJE DOGAĐAJA
  // =======================================
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  // =======================================
  // 3. KLIK NA DOGAĐAJ → IZMENI
  // =======================================
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;

    setSelectedEvent({
      _id: event.id,
      title: event.title,
      start: event.start?.toISOString().split("T")[0],
      end: event.end?.toISOString().split("T")[0],
      extendedProps: { calendar: event.extendedProps.calendar },
    });

    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar);

    openModal();
  };

  // =======================================
  // 4. DODAJ / IZMENI DOGAĐAJ
  // =======================================
  const handleAddOrUpdateEvent = async () => {
    try {
      if (selectedEvent?._id) {
        // UPDATE DOGAĐAJA
        const res = await api.put(`/api/calendar/${selectedEvent._id}`, {
          title: eventTitle,
          start: eventStartDate,
          end: eventEndDate,
          calendar: eventLevel,
        });

        const updated = res.data.event;

        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === selectedEvent._id
              ? {
                  ...ev,
                  title: updated.title,
                  start: updated.start,
                  end: updated.end,
                  extendedProps: { calendar: updated.calendar },
                }
              : ev
          )
        );
      } else {
        // DODAJ NOVI DOGAĐAJ
        const res = await api.post("/api/calendar", {
          title: eventTitle,
          start: eventStartDate,
          end: eventEndDate,
          calendar: eventLevel,
        });

        const newEvent = res.data.event;

        setEvents((prev) => [
          ...prev,
          {
            ...newEvent,
            id: newEvent._id,
            extendedProps: { calendar: newEvent.calendar },
          },
        ]);
      }
    } catch (error) {
      console.error(error);
    }

    closeModal();
    resetModalFields();
  };

  // =======================================
  // 5. OBRIŠI DOGAĐAJ
  // =======================================
  const handleDeleteEvent = async () => {
    if (!selectedEvent?._id) return;

    try {
      await api.delete(`/api/calendar/${selectedEvent._id}`);

      setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent._id));
    } catch (error) {
      console.error(error);
    }

    closeModal();
    resetModalFields();
  };

  // =======================================
  // 6. RENDER
  // =======================================
  if (loading) {
    return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje kalendara...</p>;
  }

  return (
    <>
      <PageMeta title="Kalendar" description="Pregled događaja" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            events={events}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Dodaj događaj +",
                click: () => {
                  resetModalFields();
                  openModal();
                },
              },
            }}
          />
        </div>

        {/* MODAL */}
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-6 lg:p-10">
          <div className="custom-scrollbar flex flex-col overflow-y-auto px-2">
            <h5 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              {selectedEvent ? "Izmena događaja" : "Dodavanje događaja"}
            </h5>

            <label className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-400">
              Naziv događaja
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />

            <label className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-400">
              Boja događaja
            </label>
            <div className="mt-2 flex gap-4">
              {Object.keys(calendarsEvents).map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="event-level"
                    checked={eventLevel === key}
                    onChange={() => setEventLevel(key)}
                  />
                  {key}
                </label>
              ))}
            </div>

            <label className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-400">
              Datum početka
            </label>
            <input
              type="date"
              value={eventStartDate}
              onChange={(e) => setEventStartDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />

            <label className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-400">
              Datum završetka
            </label>
            <input
              type="date"
              value={eventEndDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />

            <div className="mt-8 flex justify-end gap-4">
              {selectedEvent && (
                <button
                  onClick={handleDeleteEvent}
                  className="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
                >
                  Obriši
                </button>
              )}

              <button
                onClick={handleAddOrUpdateEvent}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Sačuvaj
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar?.toLowerCase()}`;
  return (
    <div className={`event-fc-color flex items-center gap-1 ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
