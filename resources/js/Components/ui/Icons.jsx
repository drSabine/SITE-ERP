/**
 * Central icon registry.
 *
 * ALL react-icons imports in this project go through this file.
 * Never import from react-icons/* directly in a page or component.
 * Add icons here as features are built; remove unused ones freely.
 *
 * Usage:
 *   import { EditIcon, TrashIcon } from '@/Components/ui/Icons';
 */

// Navigation / Sidebar — one distinct, accurate glyph per destination.
export { MdSpaceDashboard  as DashboardIcon        } from 'react-icons/md';
export { MdDateRange       as SchoolYearsIcon      } from 'react-icons/md';
export { MdCalendarMonth   as AcademicTermIcon     } from 'react-icons/md';
export { MdGroups          as UsersIcon            } from 'react-icons/md';
export { MdMenuBook        as CoursesIcon          } from 'react-icons/md';
export { MdSchool          as ProgramsIcon         } from 'react-icons/md';
export { MdBadge           as StudentsIcon         } from 'react-icons/md';
export { MdFactCheck       as EnrollmentsIcon      } from 'react-icons/md'; // Evaluations
export { MdGridView        as SectionsIcon         } from 'react-icons/md'; // Section Assignment
export { MdAssignmentInd   as AssignmentsIcon      } from 'react-icons/md'; // Teacher Assignment
export { MdMonitorHeart    as GradingMonitorIcon   } from 'react-icons/md';
export { MdWorkspacePremium as GraduationIcon      } from 'react-icons/md';
export { MdEditNote        as GradesIcon           } from 'react-icons/md'; // Teacher gradebook
export { MdGrade           as MyGradesIcon         } from 'react-icons/md'; // Student grades
export { MdFolderShared    as DocumentsIcon        } from 'react-icons/md';
export { MdChecklist       as SubmissionStatusIcon } from 'react-icons/md';
export { MdVerified        as VerifyIcon           } from 'react-icons/md';

// CRUD Actions
export { MdAdd             as AddIcon         } from 'react-icons/md';
export { MdEdit            as EditIcon        } from 'react-icons/md';
export { MdDelete          as TrashIcon       } from 'react-icons/md';
export { MdSave            as SaveIcon        } from 'react-icons/md';
export { MdClose           as CloseIcon       } from 'react-icons/md';
export { MdSearch          as SearchIcon      } from 'react-icons/md';
export { MdFilterList      as FilterIcon      } from 'react-icons/md';
export { MdDownload        as DownloadIcon    } from 'react-icons/md';
export { MdPrint           as PrintIcon       } from 'react-icons/md';
export { MdUploadFile      as UploadIcon      } from 'react-icons/md';
export { MdHistory         as HistoryIcon     } from 'react-icons/md';
export { MdManageSearch    as ActivityLogsIcon } from 'react-icons/md';

// Status / Feedback
export { MdCheckCircle     as CheckIcon       } from 'react-icons/md';
export { MdCancel          as CancelIcon      } from 'react-icons/md';
export { MdLock            as LockIcon        } from 'react-icons/md';
export { MdLockOpen        as UnlockIcon      } from 'react-icons/md';
export { MdPlayArrow       as ActivateIcon    } from 'react-icons/md';
export { MdStop            as FinalizeIcon    } from 'react-icons/md';

// UI / Layout
export { MdExpandMore      as ChevronDownIcon } from 'react-icons/md';
export { MdExpandLess      as ChevronUpIcon   } from 'react-icons/md';
export { MdChevronRight    as ChevronRightIcon } from 'react-icons/md';
export { MdArrowBack       as BackIcon        } from 'react-icons/md';
export { MdMoreVert        as MoreIcon        } from 'react-icons/md';
export { MdInfoOutline     as InfoIcon        } from 'react-icons/md';
