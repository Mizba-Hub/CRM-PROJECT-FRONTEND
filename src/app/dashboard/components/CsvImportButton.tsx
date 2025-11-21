import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  IconButton,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Papa from "papaparse";
import { useDispatch } from "react-redux";

import { createLeadAPI } from "../../../store/slices/leadSlice";
import { createDeal } from "../../../store/slices/dealSlice";
import { createCompany } from "../../../store/slices/companySlice";
import { createTicket } from "../../../store/slices/ticketsSlice";

interface CSVImportModalProps {
  open: boolean;
  setOpen: (state: boolean) => void;
  module: "lead" | "deal" | "company" | "ticket";
  onImportComplete?: () => void;
}

type CSVRow = Record<string, string>;

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  open,
  setOpen,
  module,
  onImportComplete,
}) => {
  const dispatch = useDispatch();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const ACTIONS = {
    lead: createLeadAPI,
    deal: createDeal,
    company: createCompany,
    ticket: createTicket,
  };

  const handleUpload = () => {
    if (!file) {
      setMessage("Please select a CSV file");
      return;
    }

    setUploading(true);
    setMessage("");

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        let success = 0;

        for (const row of rows) {
          let body: any = { ...row };

          Object.keys(body).forEach((key) => {
            if (typeof body[key] === "string") {
              body[key] = body[key]
                .replace(/[\u200B-\u200F\u00A0]/g, "")
                .trim();
            }
          });

          if (row.userIds) {
            body.userIds = row.userIds
              .split(",")
              .map((id) => Number(id.trim()));
          }
          if (row.ownerIds) {
            body.ownerIds = row.ownerIds
              .split(",")
              .map((id) => Number(id.trim()));
          }
          if (row.ownerId) {
            body.ownerId = row.ownerId
              .split(",")
              .map((id) => Number(id.trim()));
          }

          const action = ACTIONS[module];
          const res: any = await dispatch(action(body) as any);

          if (!res.error) success++;
        }

        setUploading(false);
        setMessage(`Imported ${success} records successfully`);

        if (success > 0 && onImportComplete) onImportComplete();
      },
      error: () => {
        setUploading(false);
        setMessage("Failed to read CSV");
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => !uploading && setOpen(false)}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        Import CSV
        <IconButton disabled={uploading} onClick={() => setOpen(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
          style={{ display: "none" }}
        />

        <Button
          variant="contained"
          component="label"
          htmlFor="csv-input"
          sx={{
            backgroundColor: "#4338ca",
            color: "#fff",
            textTransform: "none",
            "&:hover": { backgroundColor: "#3730a3" },
          }}
          disabled={uploading}
        >
          Choose File
        </Button>

        {file && (
          <div style={{ marginTop: "10px", fontSize: "14px" }}>
            Selected File: <strong>{file.name}</strong>
          </div>
        )}

        {message && (
          <Alert
            sx={{ mt: 2 }}
            severity={message.includes("Failed") ? "error" : "success"}
          >
            {message}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => setOpen(false)}
          disabled={uploading}
          sx={{
            backgroundColor: "#4338ca",
            color: "#fff",
            textTransform: "none",
            "&:hover": { backgroundColor: "#3730a3" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          onClick={handleUpload}
          disabled={uploading || !file}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
          sx={{
            borderColor: "#4f46e5",
            color: "#4338ca",
            textTransform: "none",
            "&:hover": {
              borderColor: "#3730a3",
              color: "#3730a3",
              backgroundColor: "rgba(67, 56, 202, 0.04)",
            },
          }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CSVImportModal;
