import React from 'react';
import { Button } from '../ui/Button';
import { getRecentProjects, removeFromRecentProjects, formatRelativeTime } from '../../utils/storage';

/**
 * RecentProjects - Panel showing recent projects for quick access
 */
const RecentProjects = ({
  onLoad,
  onClose,
  isMobile = false,
}) => {
  const [projects, setProjects] = React.useState([]);

  React.useEffect(() => {
    setProjects(getRecentProjects());
  }, []);

  const handleLoad = (project) => {
    onLoad(project.data, project.name);
  };

  const handleRemove = (e, projectId) => {
    e.stopPropagation();
    removeFromRecentProjects(projectId);
    setProjects(getRecentProjects());
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 299,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? 'calc(100% - 40px)' : '400px',
          maxWidth: '400px',
          maxHeight: '70vh',
          background: 'linear-gradient(180deg, rgba(15,20,28,0.98) 0%, rgba(8,12,16,0.98) 100%)',
          border: '1px solid rgba(0,200,255,0.3)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 300,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,200,255,0.05)',
        }}>
          <span style={{ color: '#00c8ff', fontWeight: '600', fontSize: '13px' }}>
            Recent Projects
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,100,100,0.15)',
              border: 'none',
              color: '#ff6666',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}>
          {projects.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#6080a0',
            }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>No recent projects</p>
              <p style={{ fontSize: '11px', opacity: 0.7 }}>
                Your recent work will appear here
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleLoad(project)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,200,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0,200,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(0,200,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}>
                    📐
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#e0e8f0',
                      fontSize: '13px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {project.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      color: '#6080a0',
                      fontSize: '11px',
                    }}>
                      <span>{formatRelativeTime(project.timestamp)}</span>
                      {project.wallCount > 0 && (
                        <span>{project.wallCount} walls</span>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, project.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6080a0',
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      opacity: 0.5,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                    title="Remove from recent"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
};

export default RecentProjects;
