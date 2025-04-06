import { useState } from 'react';
import type { Category, Link } from '../config/types';
import { Icon } from './Icon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BookmarkEditModalProps {
  category: Category;
  contextId: string;
  onSave: (category: Category, contextId: string) => void;
  onCancel: () => void;
  className?: string;
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center space-x-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <Icon name="GripVertical" size={16} className="text-secondary-400" />
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function BookmarkEditModal({ category, contextId, onSave, onCancel, className = '' }: BookmarkEditModalProps) {
  const [categoryName, setCategoryName] = useState(category.name);
  const [links, setLinks] = useState(category.links);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [newLink, setNewLink] = useState<Link | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isWarning: boolean;
    action: 'delete' | 'save' | null;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isWarning: false,
    action: null,
    onConfirm: () => {},
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEditLink = (link: Link) => {
    console.log('Starting to edit link:', link);
    setEditingLink({ ...link, icon: link.icon || 'Link' });
  };

  const handleSaveEdit = () => {
    if (editingLink) {
      console.log('Saving edited link:', editingLink);
      const newLinks = links.map(link => 
        link.name === editingLink.name ? editingLink : link
      );
      setLinks(newLinks);
      setEditingLink(null);
      console.log('Updated links:', newLinks);
    }
  };

  const handleCancelEdit = () => {
    console.log('Canceling link edit');
    setEditingLink(null);
  };

  const handleDeleteLink = (link: Link) => {
    console.log('Requesting to delete link:', link);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Link',
      message: `Are you sure you want to delete the link "${link.name}"? This action cannot be undone.`,
      isWarning: true,
      action: 'delete',
      onConfirm: () => {
        const newLinks = links.filter(l => l.name !== link.name);
        setLinks(newLinks);
        setConfirmDialog({
          isOpen: false,
          title: '',
          message: '',
          isWarning: false,
          action: null,
          onConfirm: () => {},
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex(link => link.name === active.id);
      const newIndex = links.findIndex(link => link.name === over.id);
      
      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);
      console.log('Reordered links:', newLinks);
    }
  };

  const handleAddLink = () => {
    console.log('Starting to add new link');
    setNewLink({ name: '', url: '', icon: 'Link' });
  };

  const handleSaveNewLink = () => {
    if (newLink && newLink.name && newLink.url) {
      console.log('Saving new link:', newLink);
      setLinks([...links, newLink]);
      setNewLink(null);
      console.log('Updated links:', [...links, newLink]);
    }
  };

  const handleCancelNewLink = () => {
    console.log('Canceling new link');
    setNewLink(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting bookmark changes:', {
      name: categoryName,
      links
    });
    onSave(
      {
        name: categoryName,
        displayMode: 'icon',
        links,
      },
      contextId
    );
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] ${className}`}>
      <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-200">Edit Bookmark</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-secondary-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded text-secondary-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-300 mb-1">
              Links
            </label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map(link => link.name)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {links.map((link) => (
                    <SortableItem key={link.name} id={link.name}>
                      <div className="p-2 bg-secondary-800 rounded">
                        {editingLink?.name === link.name ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingLink.name}
                              onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                              className="w-full px-2 py-1 bg-secondary-700 border border-secondary-600 rounded text-secondary-200"
                              placeholder="Link name"
                            />
                            <input
                              type="text"
                              value={editingLink.url}
                              onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                              className="w-full px-2 py-1 bg-secondary-700 border border-secondary-600 rounded text-secondary-200"
                              placeholder="URL"
                            />
                            <input
                              type="text"
                              value={editingLink.icon}
                              onChange={(e) => setEditingLink({ ...editingLink, icon: e.target.value })}
                              className="w-full px-2 py-1 bg-secondary-700 border border-secondary-600 rounded text-secondary-200"
                              placeholder="Icon name (e.g. Link, Github, etc)"
                            />
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="px-2 py-1 rounded bg-primary-500 text-white hover:bg-primary-600"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-2 py-1 rounded bg-secondary-700 text-secondary-200 hover:bg-secondary-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-secondary-200">{link.name}</div>
                              <div className="text-secondary-400 text-sm">{link.url}</div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditLink(link)}
                                className="p-1 rounded hover:bg-secondary-700"
                              >
                                <Icon name="Pencil" size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLink(link)}
                                className="p-1 rounded hover:bg-secondary-700"
                              >
                                <Icon name="Trash2" size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableItem>
                  ))}

                  {newLink ? (
                    <div className="p-2 bg-secondary-800 rounded">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newLink.name}
                          onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                          className="w-full px-2 py-1 bg-secondary-700 border border-secondary-600 rounded text-secondary-200"
                          placeholder="New link name"
                        />
                        <input
                          type="text"
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          className="w-full px-2 py-1 bg-secondary-700 border border-secondary-600 rounded text-secondary-200"
                          placeholder="URL"
                        />
                        <input
                          type="text"
                          value={newLink.icon}
                          onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                          className="w-full px-2 py-1 bg-secondary-700 border border-secondary-600 rounded text-secondary-200"
                          placeholder="Icon name (e.g. Link, Github, etc)"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleSaveNewLink}
                            className="px-2 py-1 rounded bg-primary-500 text-white hover:bg-primary-600"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelNewLink}
                            className="px-2 py-1 rounded bg-secondary-700 text-secondary-200 hover:bg-secondary-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="w-full p-2 bg-secondary-800 rounded hover:bg-secondary-700 text-secondary-300 flex items-center justify-center space-x-2"
                    >
                      <Icon name="Plus" size={16} />
                      <span>Add Link</span>
                    </button>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded bg-secondary-700 text-secondary-100 hover:bg-secondary-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary-500 text-white hover:bg-primary-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000]">
          <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-200 mb-4">
              {confirmDialog.title}
            </h3>
            <p className="text-secondary-300 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog({
                  isOpen: false,
                  title: '',
                  message: '',
                  isWarning: false,
                  action: null,
                  onConfirm: () => {},
                })}
                className="px-4 py-2 rounded bg-secondary-700 text-secondary-100 hover:bg-secondary-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded ${
                  confirmDialog.isWarning 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-primary-500 hover:bg-primary-600'
                } text-white`}
              >
                {confirmDialog.action === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 