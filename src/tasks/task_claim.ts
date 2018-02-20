import {Task} from './Task';
import {profile} from '../lib/Profiler';

export type claimTargetType = StructureController;
export const claimTaskName = 'claim';

@profile
export class TaskClaim extends Task {
	target!: claimTargetType;

	constructor(target: claimTargetType, options = {} as TaskOptions) {
		super(claimTaskName, target, options);
		// Settings
		this.settings.moveColor = 'purple';
	}

	isValidTask() {
		return (this.creep.getActiveBodyparts(CLAIM) > 0);
	}

	isValidTarget() {
		return (this.target != null && (!this.target.room || !this.target.owner));
	}

	work() {
		return this.creep.claimController(this.target);
	}
}
