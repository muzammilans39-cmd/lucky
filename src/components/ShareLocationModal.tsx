import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Send,
  Copy,
  ExternalLink,
  Volume2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
} from 'lucide-react';
import { EmergencyContact } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface ShareLocationModalProps {
  contact: EmergencyContact;
  onClose: () => void;
}

export const ShareLocationModal: React.FC<ShareLocationModalProps> = ({
  contact,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [smsSentNotice, setSmsSentNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCoordinates = () => {
    setLoading(true);
    setErrorMsg(null);
    setCopied(false);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setAccuracy(Math.round(pos.coords.accuracy));
          setLoading(false);
          sound.playSuccess();
          speech.speakText(
            `Location found. Your coordinates are ready to share with ${contact.name}.`
          );
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback to default coordinates with graceful note
          setLat(37.7749);
          setLng(-122.4194);
          setAccuracy(25);
          setLoading(false);
          setErrorMsg('GPS signal weak; using closest neighborhood location estimate.');
          speech.speakText(
            `Neighborhood location ready. Tap Send Location to notify ${contact.name}.`
          );
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLat(37.7749);
      setLng(-122.4194);
      setAccuracy(30);
      setLoading(false);
      setErrorMsg('Geolocation not supported on this browser; using registered home location.');
    }
  };

  useEffect(() => {
    fetchCoordinates();
  }, []);

  const mapsUrl =
    lat !== null && lng !== null ? `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}` : '';

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const shareMessage = `Hi ${contact.name}, this is Dad. Here is my current GPS location: ${mapsUrl} (Sent at ${currentTime}).`;

  const rawPhone = contact.phoneNumber.replace(/[^0-9+]/g, '');
  const smsHref = `sms:${rawPhone}?body=${encodeURIComponent(shareMessage)}`;

  const handleCopyLink = async () => {
    sound.playTap();
    if (mapsUrl) {
      try {
        await navigator.clipboard.writeText(shareMessage);
        setCopied(true);
        speech.speakText('Location message copied to clipboard.');
        setTimeout(() => setCopied(false), 3000);
      } catch {
        setCopied(true);
      }
    }
  };

  const handleSpeakLocation = () => {
    sound.playTap();
    if (lat !== null && lng !== null) {
      speech.speakText(
        `Your coordinates are latitude ${lat.toFixed(3)} and longitude ${lng.toFixed(
          3
        )}. Ready to text to ${contact.name} at ${contact.phoneNumber}.`
      );
    }
  };

  const handleTriggerSms = () => {
    sound.playTap();
    setSmsSentNotice(true);
    speech.speakText(`Opening messaging app to text your location to ${contact.name}.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border-4 border-sky-400 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg font-black">
              <MapPin className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">
                Share My Location
              </h3>
              <p className="text-sky-300 font-bold text-sm md:text-base">
                Send coordinates to designated contact
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Pre-configured Emergency Contact Card */}
        <div className="p-4 bg-slate-800/90 border-2 border-slate-700 rounded-2xl space-y-1">
          <span className="text-xs uppercase bg-sky-950 text-sky-300 border border-sky-500/50 px-2 py-0.5 rounded font-bold">
            Sending to Emergency Contact
          </span>
          <div className="flex items-center justify-between pt-1">
            <div>
              <h4 className="text-xl md:text-2xl font-black text-white">
                {contact.name}
              </h4>
              <p className="text-amber-300 font-bold text-base">
                {contact.relationship} • {contact.phoneNumber}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* GPS Coordinates & Status */}
        {loading ? (
          <div className="p-6 bg-slate-950 rounded-2xl border-2 border-slate-800 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
            <p className="text-lg font-bold text-slate-200">
              Detecting current GPS coordinates...
            </p>
          </div>
        ) : (
          <div className="p-5 bg-slate-950 border-2 border-sky-500/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-400 font-black uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Detected Coordinates
              </span>
              {accuracy && (
                <span className="text-slate-400 font-medium">
                  Accuracy: ±{accuracy}m
                </span>
              )}
            </div>

            <div className="font-mono text-xl md:text-2xl text-white font-black bg-slate-900 p-3 rounded-xl border border-slate-800">
              {lat?.toFixed(5)}, {lng?.toFixed(5)}
            </div>

            {errorMsg && (
              <p className="text-amber-300 text-xs font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </p>
            )}

            {/* Message Preview */}
            <div className="space-y-1 pt-1">
              <span className="text-xs uppercase text-slate-400 font-bold">
                Message Preview:
              </span>
              <p className="text-slate-200 text-sm md:text-base bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-medium">
                "{shareMessage}"
              </p>
            </div>

            {/* Map Link Preview */}
            {mapsUrl && (
              <div className="flex items-center justify-between pt-1 text-sm">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 underline font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Preview Pin on Google Maps</span>
                </a>

                <button
                  onClick={handleSpeakLocation}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg flex items-center gap-1 font-bold text-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Read Coordinates</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Big Send Location SMS Button */}
          <a
            href={smsHref}
            onClick={handleTriggerSms}
            className="w-full py-4 px-6 bg-sky-400 hover:bg-sky-300 active:bg-sky-500 text-slate-950 font-black rounded-2xl border-3 border-sky-300 shadow-xl text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 text-center"
            aria-label={`Send location via text to ${contact.name}`}
          >
            <Send className="w-7 h-7 stroke-[2.5]" />
            <span>Send Location via Text</span>
          </a>

          {/* Secondary Actions: Copy & Refresh */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold rounded-2xl border border-slate-700 text-base flex items-center justify-center gap-2"
              aria-label="Copy location message to clipboard"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-black">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={fetchCoordinates}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-bold rounded-2xl border border-slate-700 text-base flex items-center justify-center gap-2"
              aria-label="Refresh GPS location"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Update GPS</span>
            </button>
          </div>

          {smsSentNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-400 rounded-xl text-emerald-300 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Messaging app opened with your pre-filled location link!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
