/**
 * @file ReportContext.jsx
 * @description Provides global state for civic reports.
 * Manages fetching reports, creating new reports, updating status, upvoting, and persistent draft report form state.
 */

import React, { createContext, useState, useCallback } from 'react';
import reportService from '../services/reportService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ReportContext = createContext({});

// Hardcode offline storage key
const OFFLINE_QUEUE_KEY = 'roadreport_pending_reports';

const INITIAL_DRAFT = {
  step: 1,
  category: '',
  title: '',
  description: '',
  severity: 'medium',
  photoUri: '',
  mediaType: 'image',
  mediaDuration: null,
  location: null,
  address: '',
  isAnonymous: false
};

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persistent draft form state (never wiped out by route navigation or GPS location picks)
  const [draftReport, setDraftReport] = useState(INITIAL_DRAFT);

  const updateDraftReport = (fields) => {
    setDraftReport((prev) => ({ ...prev, ...fields }));
  };

  const resetDraftReport = () => {
    setDraftReport(INITIAL_DRAFT);
  };

  /**
   * Fetches all reports based on filters.
   * @param {Object} filters - Search, category, severity, status filters.
   */
  const fetchReports = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getReports(filters);
      if (response.success) {
        setReports(response.data);
      } else {
        setError(response.message || 'Failed to fetch reports');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error fetching reports');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches reports submitted by the logged-in user.
   */
  const fetchMyReports = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getMyReports({ page, limit });
      if (response.success) {
        if (page === 1) {
          setMyReports(response.data);
        } else {
          setMyReports((prev) => [...prev, ...response.data]);
        }
      } else {
        setError(response.message || 'Failed to fetch your reports');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error fetching user reports');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Creates a new civic report. Handles offline queue if API fails.
   * @param {Object} reportData - Fields describing the civic issue.
   * @returns {Promise<Object>} Object describing request status.
   */
  const createReport = async (reportData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.createReport(reportData);
      if (response.success) {
        setReports((prev) => [response.data, ...prev]);
        setMyReports((prev) => [response.data, ...prev]);
        resetDraftReport(); // Reset draft after successful submit
        return { success: true, offline: false, data: response.data };
      }
      return { success: false, offline: false, message: response.message };
    } catch (e) {
      if (!e.response) {
        try {
          const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
          const queue = queueJson ? JSON.parse(queueJson) : [];
          
          const offlineReport = {
            ...reportData,
            _id: `offline_${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'reported',
            upvotes: []
          };
          
          queue.push(offlineReport);
          await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
          resetDraftReport(); // Reset draft after offline queueing
          return { success: true, offline: true, data: offlineReport };
        } catch (storageError) {
          console.error('AsyncStorage error queueing report:', storageError);
        }
      }
      return {
        success: false,
        offline: false,
        message: e.response?.data?.message || 'Error submitting report'
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates report status.
   */
  const updateReportStatus = async (id, status) => {
    try {
      const response = await reportService.updateStatus(id, status);
      if (response.success) {
        const updated = response.data;
        setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: updated.status } : r)));
        setMyReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: updated.status } : r)));
        return true;
      }
    } catch (e) {
      console.error('Error updating status:', e.message);
    }
    return false;
  };

  /**
   * Toggles upvote on a report.
   */
  const toggleUpvote = async (id) => {
    try {
      const response = await reportService.toggleUpvote(id);
      if (response.success) {
        const updatedReport = response.data;
        setReports((prev) =>
          prev.map((r) => (r._id === id ? { ...r, upvotes: updatedReport.upvotes } : r))
        );
        setMyReports((prev) =>
          prev.map((r) => (r._id === id ? { ...r, upvotes: updatedReport.upvotes } : r))
        );
        return { success: true, isUpvoted: response.isUpvoted, count: response.upvotesCount };
      }
    } catch (e) {
      console.error('Error toggling upvote:', e.message);
    }
    return { success: false };
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        myReports,
        loading,
        error,
        draftReport,
        updateDraftReport,
        resetDraftReport,
        fetchReports,
        fetchMyReports,
        createReport,
        updateReportStatus,
        toggleUpvote,
        setReports,
        setMyReports
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};
