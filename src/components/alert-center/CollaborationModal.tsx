import type React from 'react';
import { useState } from 'react';
import { X, Send, Tag } from 'lucide-react';
import { type Alert, type TeamMember } from '../../types/alert';

interface CollaborationModalProps {
  isOpen: boolean;
  alert: Alert | null;
  teamMembers: TeamMember[];
  onClose: () => void;
}

const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  alert,
  teamMembers,
  onClose,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSend = () => {
    // Handle sending collaboration request
    setSelectedMembers([]);
    setMessage('');
    onClose();
  };

  if (!isOpen || !alert) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 fade-in duration-200"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white/95">Collaborate on Alert</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Info */}
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-white/95 mb-1">{alert.title}</h4>
          <p className="text-sm text-white/70">{alert.summary}</p>
        </div>

        {/* Team Members */}
        <div className="mb-4">
          <h4 className="text-white/90 font-medium mb-2">Select Team Members</h4>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <label
                key={member.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
                    {member.avatar}
                  </div>
                  <div>
                    <div className="text-white/95 text-sm">{member.name}</div>
                    <div className="text-white/60 text-xs">{member.role}</div>
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    member.status === 'online'
                      ? 'bg-green-500'
                      : member.status === 'busy'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                  }`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="mb-4">
          <h4 className="text-white/90 font-medium mb-2">Message (optional)</h4>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note about this alert..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={selectedMembers.length === 0}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${
              selectedMembers.length > 0
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationModal;
