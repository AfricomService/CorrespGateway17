export interface PermissionDTO {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canAdmin: boolean;
}

export interface CorrespPermissionsDTO {
  corresp: PermissionDTO;
  tasksPermissions: { [taskId: number]: PermissionDTO };
}
