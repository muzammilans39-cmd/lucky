import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Volume2,
  Stethoscope,
  Train,
  Users,
  Briefcase,
  X,
  Compass,
} from 'lucide-react';
import { Appointment } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface AppointmentsScreenProps {
  appointments: Appointment[];
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onDeleteAppointment: (id: string) => void;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({
  appointments,
  onAddAppointment,
  onDeleteAppointment,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState<Appointment['category']>('Doctor');

  const categories: Appointment['category'][] = ['Doctor', 'Travel', 'Family', 'Meeting', 'Other'];

  const filteredAppointments =
    selectedFilter === 'All'
      ? appointments
      : appointments.filter((a) => a.category === selectedFilter);

  const getCategoryIcon = (category: Appointment['category']) => {
    switch (category) {
      case 'Doctor':
        return <Stethoscope className="w-6 h-6 text-emerald-400" />;
      case 'Travel':
        return <Train className="w-6 h-6 text-sky-400" />;
      case 'Family':
        return <Users className="w-6 h-6 text-pink-400" />;
      case 'Meeting':
        return <Briefcase className="w-6 h-6 text-amber-400" />;
      default:
        return <Calendar className="w-6 h-6 text-purple-400" />;
    }
  };

  const speakAppointment = (apt: Appointment) => {
    sound.playTap();
    const locText = apt.location ? ` located at ${apt.location}` : '';
    const noteText = apt.notes ? `. Important notes: ${apt.notes}` : '';
    speech.speakText(
      `Appointment: ${apt.title}. Scheduled for ${apt.date} at ${apt.time}${locText}${noteText}`
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    sound.playSuccess();
    onAddAppointment({
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      location: newLocation.trim(),
      notes: newNotes.trim(),
      category: newCategory,
    });

    speech.speakText(`Added appointment: ${newTitle} on ${newDate} at ${newTime}.`);
    setNewTitle('');
    setNewLocation('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-purple-400" />
            <span>Appointments & Travel</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            Doctor visits, travel departures, family meetups, and schedules.
          </p>
        </div>

        {/* Big Add Event Button */}
        <button
          onClick={() => {
            sound.playTap();
            setShowAddModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-purple-400 hover:bg-purple-300 active:bg-purple-500 text-slate-950 font-black rounded-2xl border-2 border-purple-300 shadow-xl text-lg md:text-xl"
          aria-label="Add a new appointment or event"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
          <span>Add Appointment</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              sound.playTap();
              setSelectedFilter(cat);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-base md:text-lg border-2 transition-all ${
              selectedFilter === cat
                ? 'bg-purple-400 text-slate-950 border-purple-300 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 bg-slate-900 border-2 border-slate-800 rounded-3xl text-center">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-300 text-xl font-bold">
              No appointments found in this category.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-6 bg-slate-800/95 border-3 border-purple-400/80 rounded-3xl shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                    {getCategoryIcon(apt.category)}
                  </div>
                  <div>
                    <span className="text-xs uppercase bg-purple-950 text-purple-300 border border-purple-500 px-2.5 py-0.5 rounded-md font-bold">
                      {apt.category}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-white mt-0.5">
                      {apt.title}
                    </h3>
                  </div>
                </div>

                {/* Speak & Delete Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => speakAppointment(apt)}
                    className="p-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-amber-300 rounded-xl border border-slate-600"
                    aria-label={`Read appointment ${apt.title} aloud`}
                    title="Read details aloud"
                  >
                    <Volume2 className="w-6 h-6 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playTap();
                      onDeleteAppointment(apt.id);
                    }}
                    className="p-3 bg-slate-700 hover:bg-red-900/60 text-red-400 rounded-xl border border-slate-600"
                    aria-label={`Delete appointment ${apt.title}`}
                    title="Delete appointment"
                  >
                    <Trash2 className="w-6 h-6 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex flex-wrap items-center gap-3 text-lg md:text-xl font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  {apt.date}
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-purple-400" />
                  {apt.time}
                </span>
              </div>

              {/* Location */}
              {apt.location && (
                <div className="flex items-start gap-2 text-slate-200 text-base md:text-lg bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                  <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Location:</strong> {apt.location}
                  </span>
                </div>
              )}

              {/* Notes */}
              {apt.notes && (
                <div className="flex items-start gap-2 text-slate-300 text-base md:text-lg bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                  <FileText className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Important Notes:</strong> {apt.notes}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ================= MODAL: ADD APPOINTMENT ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-3 border-purple-400 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Calendar className="w-7 h-7 text-purple-400" />
                Add Appointment or Trip
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Title / Event Name
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Eye Specialist Clinic Visit"
                  className="w-full p-4 bg-slate-800 border-2 border-slate-700 focus:border-purple-400 text-white rounded-xl text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                >
                  <option value="Doctor">Doctor / Medical Clinic</option>
                  <option value="Travel">Travel (Train, Bus, Flight)</option>
                  <option value="Family">Family Gathering / Visit</option>
                  <option value="Meeting">Meeting / Social Group</option>
                  <option value="Other">Other Event</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-black text-lg mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-200 font-black text-lg mb-1">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Location / Room (Optional)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. St. Jude Hospital, Room 204"
                  className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 focus:border-purple-400 text-white rounded-xl text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Notes & Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Bring Medicare card and glasses. Fast 8 hours."
                  className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 focus:border-purple-400 text-white rounded-xl text-base"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-purple-400 hover:bg-purple-300 text-slate-950 font-black rounded-2xl text-lg border-2 border-purple-300 shadow-lg"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
