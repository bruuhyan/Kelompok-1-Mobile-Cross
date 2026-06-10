export const SUPPORT_EMAIL = "support.trustend@gmail.com";
export const PRIVACY_POLICY_URL = "https://rafpoo.github.io/TrustEnd/privacy/";
export const ACCOUNT_DELETION_URL = "https://rafpoo.github.io/TrustEnd/account-deletion/";

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: "Data We Collect",
    body:
      "TrustEnd collects account information such as name, email address, role, organization membership, profile photo, and account status. The app also stores attendance records, requests, reports, task submissions, trust score information, and supervisor review activity.",
  },
  {
    title: "Location and Network Data",
    body:
      "When users check in or check out, TrustEnd collects precise GPS coordinates, local network information such as WiFi SSID/BSSID when available, and local IP address. This data is used to validate attendance against organization rules and may flag records for supervisor review.",
  },
  {
    title: "Photos and User Content",
    body:
      "Users may upload profile pictures and report photos. Reports, task notes, request reasons, and review notes are stored so the organization can manage attendance and workplace operations.",
  },
  {
    title: "How We Use Data",
    body:
      "Data is used to authenticate users, manage organizations, validate attendance, calculate trust scores, support supervisor approvals, handle reports and requests, and improve reliability of the app experience.",
  },
  {
    title: "Sharing",
    body:
      "Data is shared only within the user's organization according to role permissions. Supervisors and admins can review employee attendance, requests, reports, and task data. TrustEnd does not sell personal data.",
  },
  {
    title: "Retention and Deletion",
    body:
      "Organization records are retained while the account is active or as needed for workplace audit purposes. Users can request account and data deletion from the app. Some records may be retained when required for security, legal, or organizational audit reasons.",
  },
  {
    title: "Contact",
    body: `For privacy or account deletion requests, contact ${SUPPORT_EMAIL}.`,
  },
];
