// Project Card Component

import type React from 'react';
import { Calendar } from 'lucide-react';
import Card from '../shared/Card';
import { type Project } from '../../types/campaign';
import { getStatusColor, getPriorityColor, generateAvatar } from './utils';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <Card
      className={`cursor-pointer ${getPriorityColor(project.priority)} hoverable`}
      padding="sm"
      variant="glass"
      onClick={() => onClick(project)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-white/95 text-sm">{project.title}</h4>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
          {project.priority}
        </span>
      </div>

      <p className="text-white/70 text-xs mb-3">{project.description}</p>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: `${project.progress}%`,
              backgroundColor: 'var(--page-accent)',
            }}
          />
        </div>
      </div>

      {/* Assignees and Due Date */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-1">
          {project.assignees.slice(0, 2).map((assignee, index) => (
            <div
              key={index}
              className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center"
              title={assignee}
            >
              <span className="text-white text-xs">{generateAvatar(assignee)}</span>
            </div>
          ))}
          {project.assignees.length > 2 && (
            <span className="text-white/60 text-xs">+{project.assignees.length - 2}</span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-white/60">
          <Calendar className="w-3 h-3" />
          <span>{project.dueDate}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center space-x-2 mt-2">
        {project.tags.map((tag, index) => (
          <span key={index} className="bg-white/20 text-white/80 px-2 py-1 rounded text-xs">
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
};

export default ProjectCard;
