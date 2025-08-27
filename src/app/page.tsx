"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { validateEventData, sanitizeInput, RateLimiter } from "../utils/security";
import { useEvents } from "../hooks/useEvents";

interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  location: string;
  description: string;
  link?: string;
  category?: string;
  isFree?: boolean;
  isAccessible?: boolean;
  submittedBy?: string;
  status?: 'approved' | 'pending' | 'rejected';
  rsvps?: string[];
  comments?: Comment[];
}

interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}


export default function Home() {
  // NextAuth session
  const { data: session, status } = useSession();
  const currentUser = session?.user ? {
    ...session.user,
    id: session.user.email || 'anonymous',
    isAdmin: session.user.email?.endsWith('@newwestminster.ca') || false
  } : null;
  
  // Database integration with fallback to in-memory
  const {
    events: dbEvents,
    pendingEvents: dbPendingEvents,
    createEvent: dbCreateEvent,
    updateEventStatus: dbUpdateEventStatus
  } = useEvents();

  // Rate limiter for form submissions
  const rateLimiter = useMemo(() => new RateLimiter(5, 60000), []); // 5 attempts per minute
  
  // Hybrid event state - use database events if available, otherwise local state
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  // Sync database events with local state
  useEffect(() => {
    if (dbEvents.length > 0) {
      // Convert database events to local format
      const convertedEvents: Event[] = dbEvents.map(dbEvent => ({
        id: dbEvent.id,
        title: dbEvent.title,
        date: dbEvent.date,
        time: dbEvent.time,
        location: dbEvent.location,
        description: dbEvent.description,
        link: dbEvent.link,
        category: dbEvent.category || undefined,
        isFree: dbEvent.is_free,
        isAccessible: dbEvent.is_accessible,
        submittedBy: dbEvent.submitted_by || undefined,
        status: dbEvent.status,
        rsvps: [], // Will be populated from RSVP data
        comments: (dbEvent.comments || []).map(comment => ({
          id: comment.id,
          eventId: comment.event_id,
          userId: comment.user_id,
          userName: comment.user_name,
          text: comment.text,
          timestamp: comment.created_at
        }))
      }));
      setEvents(convertedEvents);
    } else {
      // Use local events when database is not available
      setEvents(localEvents);
    }
  }, [dbEvents, localEvents]);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [form, setForm] = useState({
    title: '', date: '', time: '', location: '', description: '', link: '', category: '', isFree: false, isAccessible: false
  });
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState({
    title: '', date: '', time: '', location: '', description: '', link: '', category: '', isFree: false, isAccessible: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFree, setFilterFree] = useState<boolean|null>(null);
  const [filterAccessible, setFilterAccessible] = useState<boolean|null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'location'>('date');
  
  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // OAuth login state
  const [showLogin, setShowLogin] = useState(false);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Comment state
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Admin dashboard state
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalRSVPs: 0,
    popularEvents: [] as Event[],
    categoryStats: {} as Record<string, number>,
    monthlyViews: 0
  });
  
  // Mock external events feed
  const [externalEvents] = useState<Event[]>([
    {
      id: 'ext-1',
      title: 'City Council Meeting',
      date: '2025-08-20',
      time: '19:00',
      location: 'City Hall',
      description: 'Monthly city council meeting open to public',
      category: 'Government',
      isFree: true,
      isAccessible: true,
      status: 'approved',
      submittedBy: 'city-feed',
      rsvps: [],
      comments: []
    },
    {
      id: 'ext-2', 
      title: 'Farmers Market',
      date: '2025-08-23',
      time: '09:00',
      location: 'Queens Park',
      description: 'Weekly farmers market with local vendors',
      category: 'Community',
      isFree: true,
      isAccessible: true,
      status: 'approved',
      submittedBy: 'city-feed',
      rsvps: [],
      comments: []
    }
  ]);
  

  
  // Enhanced validation using security utilities
  const validateEventFormEnhanced = (formData: typeof form): string[] => {
    return validateEventData(formData).errors;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }
  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    // Rate limiting check
    const userIdentifier = currentUser?.id || 'anonymous';
    if (!rateLimiter.isAllowed(userIdentifier)) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(userIdentifier) / 1000);
      alert(`Too many submissions. Please wait ${remainingTime} seconds before trying again.`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate form with enhanced security validation
      const errors = validateEventFormEnhanced(form);
      if (errors.length > 0) {
        alert('Please fix the following errors:\n' + errors.join('\n'));
        return;
      }
      
      const sanitizedForm = {
        ...form,
        title: sanitizeInput(form.title),
        description: sanitizeInput(form.description),
        location: sanitizeInput(form.location)
      };
      
      // Try to create event in database first
      if (dbCreateEvent) {
        try {
          await dbCreateEvent({
            title: sanitizedForm.title,
            date: sanitizedForm.date,
            time: sanitizedForm.time,
            location: sanitizedForm.location,
            description: sanitizedForm.description,
            category: sanitizedForm.category,
            isFree: sanitizedForm.isFree,
            isAccessible: sanitizedForm.isAccessible
          });
          
          // Database creation successful
          setForm({ title: '', date: '', time: '', location: '', description: '', link: '', category: '', isFree: false, isAccessible: false });
          setShowAdd(false);
          setIsSubmitting(false);
          return;
        } catch (dbError) {
          console.warn('Database event creation failed, falling back to local storage:', dbError);
        }
      }
      
      // Fallback to local event creation
      const newEvent: Event = {
        ...sanitizedForm,
        id: Date.now().toString(),
        submittedBy: currentUser?.id,
        status: currentUser?.isAdmin ? 'approved' : 'pending',
        rsvps: [],
        comments: []
      };
      
      // Update local events
      setLocalEvents(prev => [...prev, newEvent]);
      setForm({ title: '', date: '', time: '', location: '', description: '', link: '', category: '', isFree: false, isAccessible: false });
      setShowAdd(false);
      setIsSubmitting(false);
      
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
      setIsSubmitting(false);
    }
  }
  function startEdit(event: Event) {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      link: event.link || '',
      category: event.category || '',
      isFree: event.isFree || false,
      isAccessible: event.isAccessible || false,
    });
  }
  function handleEditChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditForm({ ...editForm, [name]: checked });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  }
  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEvents(events.map(ev => ev.id === editingId ? { ...ev, ...editForm } : ev));
    setEditingId(null);
  }
  function cancelEdit() {
    setEditingId(null);
  }
  function handleDelete(id: string) {
    setEvents(events.filter(ev => ev.id !== id));
  }

  // OAuth authentication functions
  function handleOAuthLogin(provider: string) {
    signIn(provider);
    setShowLogin(false);
  }

  function handleLogout() {
    signOut();
  }

  // RSVP functions
  function toggleRSVP(eventId: string) {
    if (!currentUser) return;
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const rsvps = event.rsvps || [];
        const hasRSVP = rsvps.includes(currentUser.id);
        return {
          ...event,
          rsvps: hasRSVP 
            ? rsvps.filter(id => id !== currentUser.id)
            : [...rsvps, currentUser.id]
        };
      }
      return event;
    }));
  }

  // Comment functions
  function addComment(eventId: string) {
    if (!currentUser || !commentText.trim()) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      eventId,
      userId: currentUser.id,
      userName: currentUser.name || 'Anonymous User',
      text: commentText.trim(),
      timestamp: new Date().toISOString()
    };

    setEvents(events.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          comments: [...(event.comments || []), newComment]
        };
      }
      return event;
    }));
    
    setCommentText('');
  }

  // Admin functions
  async function approveEvent(eventId: string) {
    if (!currentUser?.isAdmin) return;
    
    // Try database first
    if (dbUpdateEventStatus) {
      try {
        await dbUpdateEventStatus(eventId, 'approved');
        return; // Database update successful
      } catch (error) {
        console.warn('Database approval failed, updating locally:', error);
      }
    }
    
    // Fallback to local update
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, status: 'approved' } : event
    ));
    setLocalEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, status: 'approved' } : event
    ));
  }

  async function rejectEvent(eventId: string) {
    if (!currentUser?.isAdmin) return;
    
    // Try database first
    if (dbUpdateEventStatus) {
      try {
        await dbUpdateEventStatus(eventId, 'rejected');
        return; // Database update successful
      } catch (error) {
        console.warn('Database rejection failed, updating locally:', error);
      }
    }
    
    // Fallback to local update
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, status: 'rejected' } : event
    ));
    setLocalEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, status: 'rejected' } : event
    ));
  }

  // Analytics functions
  const updateAnalytics = useCallback(() => {
    const allEvents = [...events, ...externalEvents];
    const totalRSVPs = allEvents.reduce((sum, event) => sum + (event.rsvps?.length || 0), 0);
    const popularEvents = allEvents
      .filter(event => event.rsvps && event.rsvps.length > 0)
      .sort((a, b) => (b.rsvps?.length || 0) - (a.rsvps?.length || 0))
      .slice(0, 5);
    
    const categoryStats: Record<string, number> = {};
    allEvents.forEach(event => {
      if (event.category) {
        categoryStats[event.category] = (categoryStats[event.category] || 0) + 1;
      }
    });

    setAnalytics({
      totalEvents: allEvents.length,
      totalRSVPs,
      popularEvents,
      categoryStats,
      monthlyViews: Math.floor(Math.random() * 1000) + 500 // Mock view count
    });
  }, [events, externalEvents]);

  // Import external events
  function importExternalEvents() {
    if (!currentUser?.isAdmin) return;
    const newEvents = externalEvents.filter(extEvent => 
      !events.some(event => event.id === extEvent.id)
    );
    setEvents([...events, ...newEvents]);
    alert(`Imported ${newEvents.length} events from city data feed`);
  }

  // SEO and accessibility improvements
  function generateSEOData() {
    const upcomingCount = events.filter(e => new Date(e.date) >= new Date()).length;
    return {
      title: `New Westminster Events - ${upcomingCount} Upcoming Events`,
      description: `Discover local events in New Westminster. ${upcomingCount} upcoming events including ${categories.slice(0, 3).join(', ')} and more.`,
      keywords: ['New Westminster', 'events', 'community', ...categories].join(', ')
    };
  }

  // Filter and sort events (including external events) - Optimized with useMemo
  const allEvents = useMemo(() => [...events, ...externalEvents], [events, externalEvents]);
  
  const approvedEvents = useMemo(() => 
    allEvents.filter(event => event.status === 'approved' || currentUser?.isAdmin),
    [allEvents, currentUser?.isAdmin]
  );
  
  const filteredEvents = useMemo(() => 
    approvedEvents
      .filter(event => {
        const matchesSearch = !searchTerm || 
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || event.category === filterCategory;
        const matchesFree = filterFree === null || event.isFree === filterFree;
        const matchesAccessible = filterAccessible === null || event.isAccessible === filterAccessible;
        return matchesSearch && matchesCategory && matchesFree && matchesAccessible;
      })
      .sort((a, b) => {
        if (sortBy === 'date') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'location') return a.location.localeCompare(b.location);
        return 0;
      }),
    [approvedEvents, searchTerm, filterCategory, filterFree, filterAccessible, sortBy]
  );

  const upcomingEvents = useMemo(() => 
    approvedEvents
      .filter(event => new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3),
    [approvedEvents]
  );

  const pendingEvents = useMemo(() => {
    // Use database pending events if available, otherwise filter local events
    if (dbPendingEvents.length > 0) {
      return dbPendingEvents.map(dbEvent => ({
        id: dbEvent.id,
        title: dbEvent.title,
        date: dbEvent.date,
        time: dbEvent.time,
        location: dbEvent.location,
        description: dbEvent.description,
        link: dbEvent.link,
        category: dbEvent.category || undefined,
        isFree: dbEvent.is_free,
        isAccessible: dbEvent.is_accessible,
        submittedBy: dbEvent.submitted_by || undefined,
        status: dbEvent.status as 'pending',
        rsvps: [],
        comments: (dbEvent.comments || []).map(comment => ({
          id: comment.id,
          eventId: comment.event_id,
          userId: comment.user_id,
          userName: comment.user_name,
          text: comment.text,
          timestamp: comment.created_at
        }))
      }));
    }
    return events.filter(event => event.status === 'pending');
  }, [dbPendingEvents, events]);
  
  const categories = useMemo(() => 
    Array.from(new Set(allEvents.map(e => e.category).filter(Boolean))),
    [allEvents]
  );

  // Update analytics when events change
  const updateAnalyticsCallback = useCallback(() => {
    updateAnalytics();
  }, [updateAnalytics]);

  React.useEffect(() => {
    updateAnalyticsCallback();
  }, [updateAnalyticsCallback]);

  function exportToICS() {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//New West Events//EN',
      ...filteredEvents.map(event => [
        'BEGIN:VEVENT',
        `UID:${event.id}@newwestevents.local`,
        `DTSTART:${event.date.replace(/-/g, '')}T${event.time.replace(':', '')}00`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        'END:VEVENT'
      ].join('\n')),
      'END:VCALENDAR'
    ].join('\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new-west-events.ics';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="font-sans min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8">
      <header className="mb-8 mt-4 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">New Westminster Events Calendar</h1>
            <p className="text-sm text-gray-500">Find, add, and manage local events</p>
          </div>
          <div className="flex gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">Welcome, {currentUser.name || 'User'}!</span>
                {currentUser.isAdmin && (
                  <>
                    <span className="text-xs bg-red-100 dark:bg-red-800 px-2 py-1 rounded">Admin</span>
                    <button
                      className="px-3 py-1 rounded bg-purple-500 text-white text-sm hover:bg-purple-600"
                      onClick={() => setShowAdminDashboard(true)}
                    >
                      Dashboard
                    </button>
                  </>
                )}
                <button
                  className="px-3 py-1 rounded bg-gray-500 text-white text-sm hover:bg-gray-600"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                {status === "loading" ? (
                  <div className="px-3 py-1 text-sm text-gray-600">Loading...</div>
                ) : (
                  <button
                    className="px-3 py-1 rounded nw-accent text-white text-sm hover:bg-accent-dark transition-colors"
                    onClick={() => setShowLogin(true)}
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {upcomingEvents.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-primary-dark/20 rounded-lg nw-border border-l-4">
            <h3 className="text-sm font-semibold mb-2">🔥 Upcoming Events</h3>
            <div className="flex flex-wrap gap-2">
              {upcomingEvents.map(event => (
                <span key={event.id} className="text-xs bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                  {event.title} - {event.date}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {currentUser?.isAdmin && pendingEvents.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">⏳ Pending Events ({pendingEvents.length})</h3>
              <button
                className="text-xs px-2 py-1 nw-primary text-white rounded hover:bg-primary-light transition-colors"
                onClick={importExternalEvents}
              >
                Import City Events
              </button>
            </div>
            <div className="space-y-2">
              {pendingEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded">
                  <span className="text-sm">{event.title} - {event.date}</span>
                  <div className="flex gap-1">
                    <button
                      className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                      onClick={() => approveEvent(event.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => rejectEvent(event.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
      <main className="flex flex-col w-full max-w-4xl gap-6 flex-grow">
        {/* Search and Filter Controls */}
        <section className="bg-white dark:bg-[#232323] rounded-lg shadow p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search events..."
                className="border rounded px-3 py-2 flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="border rounded px-3 py-2"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button
                className={`px-3 py-1 rounded ${filterFree === true ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                onClick={() => setFilterFree(filterFree === true ? null : true)}
              >
                Free Events
              </button>
              <button
                className={`px-3 py-1 rounded ${filterAccessible === true ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                onClick={() => setFilterAccessible(filterAccessible === true ? null : true)}
              >
                Accessible
              </button>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'location')}
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="location">Sort by Location</option>
              </select>
              <button
                className="px-3 py-1 rounded nw-accent text-white text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
                onClick={exportToICS}
                disabled={filteredEvents.length === 0}
              >
                Export Calendar
              </button>
            </div>
          </div>
        </section>
        {/* Add Event Form */}
        <section className="bg-white dark:bg-[#232323] rounded-lg shadow p-4 mb-4">
        {showAdd && currentUser && (
          <form
            className="mb-6 p-4 rounded border border-gray-300 bg-gray-50 dark:bg-[#26282e] flex flex-col gap-2"
            onSubmit={handleAddSubmit}
          >
            <h3 className="font-semibold mb-2">
              {currentUser.isAdmin ? 'Add Event (Auto-approved)' : 'Submit Event for Review'}
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <input name="title" required className="border rounded px-2 py-1 flex-1" placeholder="Title" value={form.title} onChange={handleAddChange} />
              <input name="date" required type="date" className="border rounded px-2 py-1" value={form.date} onChange={handleAddChange} />
              <input name="time" required type="time" className="border rounded px-2 py-1" value={form.time} onChange={handleAddChange} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <input name="location" className="border rounded px-2 py-1 flex-1" placeholder="Location" value={form.location} onChange={handleAddChange} />
              <input name="link" className="border rounded px-2 py-1 flex-1" placeholder="Event URL (optional)" value={form.link} onChange={handleAddChange} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <select name="category" className="border rounded px-2 py-1" value={form.category} onChange={handleAddChange}>
                <option value="">Select Category</option>
                <option value="Community">Community</option>
                <option value="Arts">Arts</option>
                <option value="Sports">Sports</option>
                <option value="Education">Education</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <textarea name="description" className="border rounded px-2 py-1" placeholder="Description" value={form.description} onChange={handleAddChange} />
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input name="isFree" type="checkbox" checked={form.isFree} onChange={handleAddChange} />
                  Free Event
                </label>
                <label className="flex items-center gap-2">
                  <input name="isAccessible" type="checkbox" checked={form.isAccessible} onChange={handleAddChange} />
                  Wheelchair Accessible
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="nw-primary text-white px-3 py-1.5 rounded hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
              <button type="button" className="bg-gray-200 text-black px-3 py-1.5 rounded dark:bg-[#232323] dark:text-gray-100" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        )}
        </section>

        {/* Events List */}
        <section className="bg-white dark:bg-[#232323] rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Events</h2>
            <span className="flex gap-2">
              <button className={`px-2 py-1 rounded text-sm transition-colors ${viewMode === 'list' ? 'nw-primary text-white' : 'bg-gray-200 dark:bg-[#232323] hover:bg-gray-300 dark:hover:bg-gray-600'}`} onClick={() => setViewMode('list')}>List</button>
              <button className={`px-2 py-1 rounded text-sm transition-colors ${viewMode === 'calendar' ? 'nw-primary text-white' : 'bg-gray-200 dark:bg-[#232323] hover:bg-gray-300 dark:hover:bg-gray-600'}`} onClick={() => setViewMode('calendar')}>Calendar</button>
              <button
                className="px-4 py-1 rounded nw-accent text-white text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
                onClick={() => setShowAdd(true)}
                disabled={!currentUser}
              >
                {currentUser ? 'Add Event' : 'Login to Add Events'}
              </button>
            </span>
          </div>
          {filteredEvents.length === 0 && events.length > 0 && (
            <div className="text-gray-400 text-center p-6">No events match your search criteria.</div>
          )}
          {events.length === 0 && (
            <div className="text-gray-400 text-center p-6">No events to show! Add your first event above.</div>
          )}
          {viewMode === 'list' ? (
            <ul className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <li key={event.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {editingId === event.id ? (
                    <form onSubmit={handleEditSubmit} className="flex flex-col gap-2 w-full">
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                        <input name="title" required className="border rounded px-2 py-1 flex-1" placeholder="Title" value={editForm.title} onChange={handleEditChange} />
                        <input name="date" required type="date" className="border rounded px-2 py-1" value={editForm.date} onChange={handleEditChange} />
                        <input name="time" required type="time" className="border rounded px-2 py-1" value={editForm.time} onChange={handleEditChange} />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                        <input name="location" className="border rounded px-2 py-1 flex-1" placeholder="Location" value={editForm.location} onChange={handleEditChange} />
                        <input name="link" className="border rounded px-2 py-1 flex-1" placeholder="Event URL (optional)" value={editForm.link} onChange={handleEditChange} />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                        <select name="category" className="border rounded px-2 py-1" value={editForm.category} onChange={handleEditChange}>
                          <option value="">Select Category</option>
                          <option value="Community">Community</option>
                          <option value="Arts">Arts</option>
                          <option value="Sports">Sports</option>
                          <option value="Education">Education</option>
                          <option value="Business">Business</option>
                        </select>
                      </div>
                      <textarea name="description" className="border rounded px-2 py-1" placeholder="Description" value={editForm.description} onChange={handleEditChange} />
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input name="isFree" type="checkbox" checked={editForm.isFree} onChange={handleEditChange} />
                          Free Event
                        </label>
                        <label className="flex items-center gap-2">
                          <input name="isAccessible" type="checkbox" checked={editForm.isAccessible} onChange={handleEditChange} />
                          Wheelchair Accessible
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Save</button>
                        <button type="button" className="text-xs px-2 py-1 bg-gray-300 text-black rounded" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span className="block font-medium">{event.title}</span>
                        <span className="block text-xs text-gray-500">
                          {event.date} @ {event.time}, {event.location}
                          {event.category && <span className="ml-2 px-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">{event.category}</span>}
                          {event.status === 'pending' && <span className="ml-2 px-1 bg-yellow-200 dark:bg-yellow-700 rounded text-xs">Pending</span>}
                        </span>
                        <span className="block text-sm text-gray-700 dark:text-gray-300">{event.description}</span>
                        {event.link && (
                          <div className="mt-1">
                            <a 
                              href={event.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              🔗 Event Website
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                        <div className="flex gap-2 mt-1">
                          {event.isFree && <span className="text-xs bg-green-100 dark:bg-green-800 px-2 py-0.5 rounded">Free</span>}
                          {event.isAccessible && <span className="text-xs bg-purple-100 dark:bg-purple-800 px-2 py-0.5 rounded">♿ Accessible</span>}
                          {event.rsvps && event.rsvps.length > 0 && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">
                              {event.rsvps.length} RSVP{event.rsvps.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {currentUser && (
                          <div className="flex gap-2 mt-2">
                            <button
                              className={`text-xs px-2 py-1 rounded ${
                                event.rsvps?.includes(currentUser.id)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                              onClick={() => toggleRSVP(event.id)}
                            >
                              {event.rsvps?.includes(currentUser.id) ? 'Cancel RSVP' : 'RSVP'}
                            </button>
                            <button
                              className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
                              onClick={() => setShowComments(showComments === event.id ? null : event.id)}
                            >
                              Comments ({event.comments?.length || 0})
                            </button>
                          </div>
                        )}
                        {showComments === event.id && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="space-y-2 mb-3">
                              {event.comments?.map(comment => (
                                <div key={comment.id} className="text-sm">
                                  <span className="font-medium">{comment.userName}:</span>
                                  <span className="ml-2">{comment.text}</span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {new Date(comment.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {currentUser && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Add a comment..."
                                  className="flex-1 border rounded px-2 py-1 text-sm"
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && addComment(event.id)}
                                />
                                <button
                                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                                  onClick={() => addComment(event.id)}
                                >
                                  Post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="flex gap-2">
                        {(currentUser?.isAdmin || event.submittedBy === currentUser?.id) && (
                          <>
                            <button className="text-xs px-2 py-1 bg-blue-500 text-white rounded" onClick={() => startEdit(event)}>Edit</button>
                            <button className="text-xs px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(event.id)}>Delete</button>
                          </>
                        )}
                        {currentUser?.isAdmin && event.status === 'pending' && (
                          <>
                            <button className="text-xs px-2 py-1 bg-green-500 text-white rounded" onClick={() => approveEvent(event.id)}>Approve</button>
                            <button className="text-xs px-2 py-1 bg-red-500 text-white rounded" onClick={() => rejectEvent(event.id)}>Reject</button>
                          </>
                        )}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="min-h-[400px] flex flex-col">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => navigateMonth('prev')}
                  className="px-3 py-1 nw-primary-light text-white rounded hover:opacity-90 transition-opacity"
                >
                  ← Prev
                </button>
                <h3 className="text-lg font-semibold">{formatMonthYear(currentMonth)}</h3>
                <button 
                  onClick={() => navigateMonth('next')}
                  className="px-3 py-1 nw-primary-light text-white rounded hover:opacity-90 transition-opacity"
                >
                  Next →
                </button>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-8 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before month starts */}
                {[...Array(getFirstDayOfMonth(currentMonth))].map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"></div>
                ))}
                
                {/* Days of the month */}
                {[...Array(getDaysInMonth(currentMonth))].map((_, d) => {
                  const day = d + 1;
                  const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const dayEvents = filteredEvents.filter(ev => ev.date === dateStr);
                  const isToday = new Date().toDateString() === new Date(dateStr).toDateString();
                  
                  return (
                    <div 
                      key={day} 
                      className={`h-20 border border-gray-200 dark:border-gray-700 p-1 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900'}`}
                    >
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {day}
                      </div>
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div 
                            key={event.id} 
                            className="text-xs p-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded truncate"
                            title={`${event.time} - ${event.title}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Events list for current month */}
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Events in {formatMonthYear(currentMonth)}</h4>
                <div className="max-h-40 overflow-y-auto">
                  {filteredEvents
                    .filter(ev => {
                      const eventDate = new Date(ev.date);
                      return eventDate.getMonth() === currentMonth.getMonth() && 
                             eventDate.getFullYear() === currentMonth.getFullYear();
                    })
                    .map(ev => (
                      <div key={ev.id} className="text-sm py-1 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium">{ev.date}</span> at {ev.time} - {ev.title}
                        {ev.location && <span className="text-gray-500"> @ {ev.location}</span>}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Admin Dashboard Modal */}
        {showAdminDashboard && currentUser?.isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAdminDashboard(false)}
                >
                  ✕
                </button>
              </div>
              
              {/* Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Events</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics.totalEvents}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-300">Total RSVPs</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{analytics.totalRSVPs}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Monthly Views</h3>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{analytics.monthlyViews}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pendingEvents.length}</p>
                </div>
              </div>

              {/* Popular Events */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">📈 Popular Events</h3>
                <div className="space-y-2">
                  {analytics.popularEvents.length > 0 ? (
                    analytics.popularEvents.map(event => (
                      <div key={event.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {event.rsvps?.length || 0} RSVPs
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No RSVPs yet</p>
                  )}
                </div>
              </div>

              {/* Category Statistics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">📊 Category Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(analytics.categoryStats).map(([category, count]) => (
                    <div key={category} className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
                      <p className="font-medium">{category}</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">🔍 SEO Status</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <p className="text-sm"><strong>Title:</strong> {generateSEOData().title}</p>
                  <p className="text-sm mt-2"><strong>Description:</strong> {generateSEOData().description}</p>
                  <p className="text-sm mt-2"><strong>Keywords:</strong> {generateSEOData().keywords}</p>
                </div>
              </div>

              {/* Accessibility Report */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">♿ Accessibility Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                    <h4 className="font-medium text-green-700 dark:text-green-300">Accessible Events</h4>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {allEvents.filter(e => e.isAccessible).length}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {Math.round((allEvents.filter(e => e.isAccessible).length / allEvents.length) * 100)}% of events
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">Free Events</h4>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {allEvents.filter(e => e.isFree).length}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {Math.round((allEvents.filter(e => e.isFree).length / allEvents.length) * 100)}% of events
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Integration */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">🔗 Data Integration</h3>
                <div className="flex gap-4">
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={importExternalEvents}
                  >
                    Import City Events Feed
                  </button>
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => alert('Export feature would integrate with city systems')}
                  >
                    Export to City Portal
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Last sync: {new Date().toLocaleDateString()} • {externalEvents.length} external events available
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={() => setShowAdminDashboard(false)}
                >
                  Close Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* OAuth Login Modal */}
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Sign In</h2>
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                
                <button
                  onClick={() => handleOAuthLogin('github')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
                
                <button
                  onClick={() => handleOAuthLogin('facebook')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
                
                <button
                  onClick={() => handleOAuthLogin('twitter')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="#1DA1F2" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Continue with Twitter
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 text-center">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="mt-4 text-center text-xs text-gray-400 pb-2">New West Event Calendar &copy; 2025</footer>
    </div>
  );
}

