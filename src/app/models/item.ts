export enum ItemType {
  EPIC = "EPIC",
  MILESTONE = "MILESTONE",
  STORY = "STORY",
  FEATURE = "FEATURE",
  SUB_FEATURE = "SUB_FEATURE",
  IMPROVEMENT = "IMPROVEMENT",
  TASK = "TASK",
  SUB_TASK = "SUB_TASK",
  BUG = "BUG",
  TEST = "TEST",
  CUSTOMER_REQUIREMENT = "CUSTOMER_REQUIREMENT",
  FUNCTIONAL_REQUIREMENT = "FUNCTIONAL_REQUIREMENT",
  NON_FUNCTIONAL_REQUIREMENT = "NON_FUNCTIONAL_REQUIREMENT"
}

export const ItemTypeColorMap = {
  'EPIC': '#ff842b',
  'MILESTONE': '#8730ff',
  'STORY': '#e3c710',
  'FEATURE': '#039e18',
  'SUB_FEATURE': '#6acc77',
  'IMPROVEMENT': '#97c900',
  'TASK': '#2f85ed',
  'SUB_TASK': '#6cb0f0',
  'BUG': '#d04337',
  'TEST': '#2bffb5',
  'CUSTOMER_REQUIREMENT': '#fb3ea8',
  'FUNCTIONAL_REQUIREMENT': '#f25ab0',
  'NON_FUNCTIONAL_REQUIREMENT': '#f27eca',
}

export enum ItemRelationType {
  RELATES_TO = "RELATES_TO", // applies both ways
  BLOCKS = "BLOCKS",
  IS_BLOCKED_BY = "IS_BLOCKED_BY",
  CLONES = "CLONES",
  IS_CLONED_BY = "IS_CLONED_BY",
  DEPENDS_ON = "DEPENDS_ON",
  IS_DEPENDENCY_FOR = "IS_DEPENDENCY_FOR",
  DUPLICATES = "DUPLICATES",
  IS_DUPLICATED_BY = "IS_DUPLICATED_BY",
  EXECUTES = "EXECUTES",
  IS_EXECUTED_BY = "IS_EXECUTED_BY",
  CAUSES = "CAUSES",
  IS_CAUSED_BY = "IS_CAUSED_BY",
  SOLVES = "SOLVES",
  IS_SOLVED_BY = "IS_SOLVED_BY",
  TESTS = "TESTS",
  IS_TESTED_BY = "IS_TESTED_BY",
  VALIDATES = "VALIDATES",
  IS_VALIDATED_BY = "IS_VALIDATED_BY",
  IMPLEMENTS = "IMPLEMENTS",
  IS_IMPLEMENTED_BY = "IS_IMPLEMENTED_BY",
  DELIVERS = "DELIVERS",
  IS_DELIVERED_BY = "IS_DELIVERED_BY",
  AFFECTS = "AFFECTS",
  IS_AFFECTED_BY = "IS_AFFECTED_BY",
  IS_PARENT_OF = "IS_PARENT_OF",
  IS_CHILD_OF = "IS_CHILD_OF",
  HAS_TO_BE_DONE_WITH = "HAS_TO_BE_DONE_WITH", // applies both ways
  HAS_TO_BE_DONE_BEFORE = "HAS_TO_BE_DONE_BEFORE",
  HAS_TO_BE_DONE_AFTER = "HAS_TO_BE_DONE_AFTER",
}

export enum ItemPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
  BLOCKER = "BLOCKER",
}

export enum ItemResolution {
  FIXED = "FIXED",
  WONT_FIX = "WONT_FIX",
  DONE = "DONE",
  WONT_DO = "WONT_DO",
  DUPLICATE = "DUPLICATE",
  INCOMPLETE = "INCOMPLETE",
  ISSUES_FOUND = "ISSUES_FOUND",
  NO_ISSUES_FOUND = "NO_ISSUES_FOUND",
  CANNOT_REPRODUCE = "CANNOT_REPRODUCE",
}

export interface IItemRelation {
  type: ItemRelationType;
  itemId: string;
}

export interface IItemComment {
  _id?: string;
  userId: string;
  comment: string;
  timestamp: Date;
}

export interface IAIItemSummary {
  summary: string;
}

export interface IItem {
  _id: string;
  projectId: string;
  sprintId?: string[];
  code: string;
  name: string;
  description?: string;
  ai_summary?: string;
  type: ItemType;
  reporterId: string;
  assigneeId?: string;
  complexity?: number;
  estimate?: number;
  hours_left?: number;
  column?: string;
  priority: ItemPriority;
  labels?: string[];
  resolution?: ItemResolution;
  epicId?: string;
  relations?: IItemRelation[];
  comments?: IItemComment[];
  done_date?: Date;
  deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAIItemSummaryPayload {
  name: string;
  description: string;
  type: ItemType;
  language: string;
  epicId?: string;
}

export interface IItemPayload {
  projectId: string;
  sprintId?: string[];
  name: string;
  description?: string;
  ai_summary?: string;
  type: ItemType;
  reporterId: string;
  assigneeId?: string;
  complexity?: number;
  estimate?: number;
  column?: string;
  priority: ItemPriority;
  labels?: string[];
  resolution?: ItemResolution;
  epicId?: string;
  relations?: {
    type: ItemRelationType;
    itemId: string;
  }[];
  done_date?: Date;
}

export interface IItemLogHoursPayload {
  hours: number;
}
