import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
  const { token } = useAuth();

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
        const res = await axios.get("https://medikalija-api.vercel.app/api/calendar", {
          headers: { Authorization: `Bearer ${token}` },
        });

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
  }, [token]);

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
        const res = await axios.put(
          `https://medikalija-api.vercel.app/api/calendar/${selectedEvent._id}`,
          {
            title: eventTitle,
            start: eventStartDate,
            end: eventEndDate,
            calendar: eventLevel,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

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
        const res = await axios.post(
          "https://medikalija-api.vercel.app/api/calendar",
          {
            title: eventTitle,
            start: eventStartDate,
            end: eventEndDate,
            calendar: eventLevel,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

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
      await axios.delete(
        `https://medikalija-api.vercel.app/api/calendar/${selectedEvent._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
    return <p className="p-4 text-lg">Učitavanje kalendara...</p>;
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
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <h5 className="mb-2 font-semibold text-gray-800 text-xl">
              {selectedEvent ? "Izmena događaja" : "Dodavanje događaja"}
            </h5>

            <label className="mt-4 text-sm font-medium text-gray-700">
              Naziv događaja
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="h-11 w-full rounded-lg border px-4"
            />

            <label className="mt-6 text-sm font-medium text-gray-700">
              Boja događaja
            </label>
            <div className="flex gap-4 mt-2">
              {Object.keys(calendarsEvents).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
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

            <label className="mt-6 text-sm font-medium text-gray-700">
              Datum početka
            </label>
            <input
              type="date"
              value={eventStartDate}
              onChange={(e) => setEventStartDate(e.target.value)}
              className="h-11 w-full rounded-lg border px-4"
            />

            <label className="mt-6 text-sm font-medium text-gray-700">
              Datum završetka
            </label>
            <input
              type="date"
              value={eventEndDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              className="h-11 w-full rounded-lg border px-4"
            />

            <div className="flex justify-end gap-4 mt-8">
              {selectedEvent && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                >
                  Obriši
                </button>
              )}

              <button
                onClick={handleAddOrUpdateEvent}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg"
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
