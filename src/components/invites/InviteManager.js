import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Box,
  Chip,
  Grid,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import axios from "axios";
import moment from "moment";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import { inviteSignupUrl } from "@/utils/invites";

function statusChip(invite) {
  if (invite.revoked_at) {
    return <Chip size="small" label="Revoked" />;
  }
  if (!invite.active) {
    return <Chip size="small" color="warning" variant="outlined" label="Expired" />;
  }
  return <Chip size="small" color="success" variant="outlined" label="Active" />;
}

function origin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

async function copyText(label, value) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error(`Could not copy the ${label.toLowerCase()}.`);
  }
}

function shareWhatsApp(url) {
  const text = `Join Learn Linker as a teacher. Open this link and create your account:\n${url}`;
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export default function InviteManager() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [fresh, setFresh] = useState(null);
  const [pendingRevoke, setPendingRevoke] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const response = await axios.get("/api/invites");
      setInvites(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading invites:", error);
      toast.error("Could not load invites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post("/api/invites", {
        note,
        maxUses,
        expiresInDays,
      });
      setFresh(response.data);
      setNote("");
      await refresh();
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error(error?.response?.data?.message || "Could not create the invite.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    const target = pendingRevoke;
    setPendingRevoke(null);
    if (!target) return;

    try {
      await axios.delete(`/api/invites/${target.id}`);
      toast.success("Invite revoked.");
      if (fresh?.id === target.id) setFresh(null);
      await refresh();
    } catch (error) {
      console.error("Error revoking invite:", error);
      toast.error(error?.response?.data?.message || "Could not revoke the invite.");
    }
  };

  return (
    <PageShell
      title="Teacher invites"
      subtitle="Create a code, then copy the link or send it on WhatsApp. Students cannot use these — teacher sign-up is a separate page."
    >
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                New invite
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                One-time codes are safest. Use a higher limit only when several
                teachers are joining at once.
              </Typography>
              <Box component="form" onSubmit={handleCreate}>
                <Stack spacing={2}>
                  <TextField
                    label="Who is this for?"
                    placeholder="Priya — Physics"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    helperText="Optional. Only you see this label."
                  />
                  <TextField
                    select
                    label="How many teachers"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  >
                    <MenuItem value="1">One teacher</MenuItem>
                    <MenuItem value="5">Up to 5</MenuItem>
                    <MenuItem value="10">Up to 10</MenuItem>
                    <MenuItem value="unlimited">No limit</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Expires"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                  >
                    <MenuItem value="7">In 7 days</MenuItem>
                    <MenuItem value="30">In 30 days</MenuItem>
                    <MenuItem value="never">Never</MenuItem>
                  </TextField>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<AddRoundedIcon />}
                    disabled={saving}
                  >
                    {saving ? "Creating…" : "Create invite"}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          {fresh && (
            <Alert
              severity="success"
              onClose={() => setFresh(null)}
              sx={{ mb: 2.5, borderRadius: 2 }}
            >
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                Invite ready{fresh.note ? ` for ${fresh.note}` : ""}
              </Typography>
              <Typography
                sx={{ fontFamily: "monospace", fontSize: 18, letterSpacing: "0.08em", mb: 1.5 }}
              >
                {fresh.code}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ContentCopyRoundedIcon />}
                  onClick={() => copyText("Code", fresh.code)}
                >
                  Copy code
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LinkRoundedIcon />}
                  onClick={() =>
                    copyText("Link", inviteSignupUrl(origin(), fresh.code))
                  }
                >
                  Copy link
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    shareWhatsApp(inviteSignupUrl(origin(), fresh.code))
                  }
                >
                  WhatsApp
                </Button>
              </Stack>
            </Alert>
          )}

          <Card>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Issued codes
              </Typography>
              {loading ? (
                <Stack spacing={1.5}>
                  <Skeleton variant="rounded" height={72} />
                  <Skeleton variant="rounded" height={72} />
                </Stack>
              ) : invites.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No invites yet. Create one to send a teacher the sign-up link.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {invites.map((invite) => {
                    const url = inviteSignupUrl(origin(), invite.code);
                    const uses =
                      invite.max_uses == null
                        ? `${invite.use_count} used`
                        : `${invite.use_count} / ${invite.max_uses} used`;

                    return (
                      <Box
                        key={invite.id}
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1.5,
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography
                              sx={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                              }}
                            >
                              {invite.code}
                            </Typography>
                            {statusChip(invite)}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {invite.note || "No label"} · {uses}
                            {invite.expires_at
                              ? ` · expires ${moment(invite.expires_at).format("DD MMM YYYY")}`
                              : " · no expiry"}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Copy code">
                            <IconButton
                              size="small"
                              onClick={() => copyText("Code", invite.code)}
                              aria-label="Copy code"
                            >
                              <ContentCopyRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy sign-up link">
                            <span>
                              <IconButton
                                size="small"
                                disabled={!invite.active}
                                onClick={() => copyText("Link", url)}
                                aria-label="Copy sign-up link"
                              >
                                <LinkRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {invite.active && (
                            <Tooltip title="Revoke">
                              <IconButton
                                size="small"
                                onClick={() => setPendingRevoke(invite)}
                                aria-label="Revoke invite"
                              >
                                <CloseRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={Boolean(pendingRevoke)} onClose={() => setPendingRevoke(null)}>
        <DialogTitle>Revoke {pendingRevoke?.code}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            The link will stop working immediately. Accounts already created with
            this code are not affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingRevoke(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleRevoke}>
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
