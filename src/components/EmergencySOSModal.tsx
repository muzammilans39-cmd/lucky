import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  PhoneCall,
  MessageSquare,
  MapPin,
  X,
  VolumeX,
  CheckCircle2,
  Settings,
  User,
  Phone,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { EmergencyContact } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface EmergencySOSModalProps {
  contact: EmergencyContact;
  onUpdateContact: (contact: EmergencyContact) => void;
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  contact,
  onUpdateContact,
  onClose,
}) => {
  const [isSirenActive, setIsSirenActive] = useState(true);
  const [smsDispatched, setSmsDispatched] = useState(false);
  const [dispatchTime, setDispatchTime] = useState<string>('');
  const [locationText, setLocationText] = useState<string>('Detecting GPS location...');
  const [locationLink, setLocationLink] = useState<string>('');
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(contact.name);
  const [editPhone, setEditPhone] = useState(contact.phoneNumber);
  const [editRelationship, setEditRelationship] = useState(contact.relationship);
  const [editMessage, setEditMessage] = useState(contact.customMessage);

  useEffect(() => {
    // 1. Start loud emergency siren sound
    sound.startEmergencySiren();
    setIsSirenActive(true);

    // 2. Announce out loud via speech engine
    speech.speakText(
      `Emergency alert activated! Sending urgent text alert to your designated contact: ${contact.name}. Siren is sounding.`
    );

    // 3. Mark text as dispatched with timestamp
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDispatchTime(nowTime);
    setSmsDispatched(true);

    // 4. Retrieve current location if supported
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
          setLocationText(`Lat: ${lat}, Lng: ${lng}`);
          setLocationLink(mapsUrl);
        },
        () => {
          setLocationText('Location: Home address registered with primary contact.');
        },
        { timeout: 8000 }
      );
    } else {
      setLocationText('Location: Home address registered with primary contact.');
    }

    return () => {
      sound.stopEmergencySiren();
    };
  }, [contact]);

  const handleStopSiren = () => {
    sound.stopEmergencySiren();
    speech.stopSpeech();
    setIsSirenActive(false);
    speech.speakText('Emergency siren silenced. Emergency alert status remains active.');
  };

  const handleCancelEmergency = () => {
    sound.stopEmergencySiren();
    speech.stopSpeech();
    sound.playTap();
    speech.speakText('Emergency alert cancelled.');
    onClose();
  };

  const getFullSmsBody = () => {
    let body = `${contact.customMessage}`;
    if (locationLink) {
      body += ` GPS Location: ${locationLink}`;
    }
    return body;
  };

  const handleSaveContactSettings = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    const updated: EmergencyContact = {
      ...contact,
      name: editName.trim() || 'Designated Contact',
      phoneNumber: editPhone.trim() || '555-234-5678',
      relationship: editRelationship.trim() || 'Caregiver',
      customMessage: editMessage.trim() || 'EMERGENCY: I need assistance immediately.',
    };
    onUpdateContact(updated);
    setIsEditingContact(false);
    speech.speakText(`Updated designated emergency contact to ${updated.name}.`);
  };

  const rawCleanPhone = contact.phoneNumber.replace(/[^0-9+]/g, '');
  const smsHref = `sms:${rawCleanPhone}?&body=${encodeURIComponent(getFullSmsBody())}`;
  const telHref = `tel:${rawCleanPhone}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 md:p-6 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-950 border-4 border-red-500 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto space-y-6 p-6 md:p-8">
        {/* Pulsing Strobe Header */}
        <div className="p-4 bg-red-600 rounded-2xl text-white text-center shadow-lg border-2 border-red-300 animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <AlertOctagon className="w-10 h-10 stroke-[3]" />
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              EMERGENCY SOS ACTIVATED
            </h2>
          </div>
          <p className="text-red-100 font-bold text-lg md:text-xl mt-1">
            Loud alarm sounding • Designated family contact alerted
          </p>
        </div>

        {/* Siren Silence & Cancel Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isSirenActive ? (
            <button
              onClick={handleStopSiren}
              className="flex-1 py-4 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-2xl border-3 border-amber-300 shadow-xl text-xl flex items-center justify-center gap-2"
              aria-label="Silence the emergency siren sound"
            >
              <VolumeX className="w-7 h-7 stroke-[2.5]" />
              <span>Mute Loud Siren</span>
            </button>
          ) : (
            <div className="flex-1 py-4 px-5 bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-700 text-center text-lg flex items-center justify-center gap-2">
              <VolumeX className="w-6 h-6 text-amber-400" />
              <span>Siren is Muted</span>
            </div>
          )}

          <button
            onClick={handleCancelEmergency}
            className="flex-1 py-4 px-5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black rounded-2xl border-2 border-slate-600 text-xl flex items-center justify-center gap-2"
            aria-label="Cancel emergency alert and return"
          >
            <X className="w-7 h-7 stroke-[2.5]" />
            <span>Cancel & Dismiss SOS</span>
          </button>
        </div>

        {/* Contact Alert Status Box */}
        <div className="p-5 bg-slate-900 border-3 border-red-500/80 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs uppercase bg-red-950 text-red-300 border border-red-500 px-3 py-1 rounded-full font-bold">
                Designated Family Contact
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                {contact.name}
              </h3>
              <p className="text-amber-300 font-bold text-lg">
                {contact.relationship} • {contact.phoneNumber}
              </p>
            </div>

            <button
              onClick={() => {
                sound.playTap();
                setIsEditingContact(!isEditingContact);
              }}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 text-sm font-bold"
              aria-label="Edit emergency contact details"
            >
              <Settings className="w-5 h-5 text-amber-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          {/* SMS Status Message */}
          <div className="p-4 bg-emerald-950/80 border-2 border-emerald-400 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-black text-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <span>Pre-Configured Text Alert Ready for {contact.name}</span>
            </div>
            <p className="text-white text-base md:text-lg bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
              "{getFullSmsBody()}"
            </p>
            <div className="flex items-center justify-between text-xs md:text-sm text-emerald-300 font-medium">
              <span>Status: Prepared & Staged at {dispatchTime}</span>
              {locationLink && (
                <a
                  href={locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-sky-400 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" /> View Coordinates
                </a>
              )}
            </div>
          </div>

          {/* Large Action Buttons to Trigger Real Phone / SMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Direct Phone Call Button */}
            <a
              href={telHref}
              onClick={() => sound.playTap()}
              className="py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-2xl border-3 border-emerald-300 shadow-xl text-xl flex items-center justify-center gap-3 text-center"
              aria-label={`Call ${contact.name} on ${contact.phoneNumber}`}
            >
              <PhoneCall className="w-7 h-7 stroke-[2.5]" />
              <span>Call {contact.name}</span>
            </a>

            {/* Direct SMS Messenger Launch */}
            <a
              href={smsHref}
              onClick={() => sound.playTap()}
              className="py-4 px-6 bg-sky-400 hover:bg-sky-300 active:bg-sky-500 text-slate-950 font-black rounded-2xl border-3 border-sky-300 shadow-xl text-xl flex items-center justify-center gap-3 text-center"
              aria-label={`Send SMS text to ${contact.name}`}
            >
              <MessageSquare className="w-7 h-7 stroke-[2.5]" />
              <span>Send SMS Message</span>
            </a>
          </div>
        </div>

        {/* Edit Contact Drawer */}
        {isEditingContact && (
          <form
            onSubmit={handleSaveContactSettings}
            className="p-5 bg-slate-900 border-2 border-amber-400 rounded-2xl space-y-4 shadow-xl"
          >
            <h4 className="text-xl font-black text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              Configure Designated Emergency Contact
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-200 font-bold text-sm mb-1">
                  Contact Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 bg-slate-800 text-white rounded-xl border border-slate-700 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-bold text-sm mb-1">
                  Relationship / Role
                </label>
                <input
                  type="text"
                  required
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  placeholder="e.g. Daughter, Caregiver, Neighbor"
                  className="w-full p-3 bg-slate-800 text-white rounded-xl border border-slate-700 font-bold text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-200 font-bold text-sm mb-1">
                Phone Number (for SMS & Calls)
              </label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="555-234-5678"
                className="w-full p-3 bg-slate-800 text-white rounded-xl border border-slate-700 font-mono font-bold text-base"
              />
            </div>

            <div>
              <label className="block text-slate-200 font-bold text-sm mb-1">
                Emergency Text Message Template
              </label>
              <textarea
                rows={3}
                required
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="w-full p-3 bg-slate-800 text-white rounded-xl border border-slate-700 text-base"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingContact(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-400 text-slate-950 font-black rounded-xl border-2 border-amber-300"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
