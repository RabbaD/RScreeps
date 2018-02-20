import {Overlord} from './Overlord';
import {DirectiveBootstrap} from '../directives/directive_bootstrap';
import {CreepSetup} from '../creepSetup/CreepSetup';
import {MiningOverlord} from './overlord_mine';
import {ColonyStage} from '../Colony';
import {Zerg} from '../Zerg';
import {Tasks} from '../tasks/Tasks';
import {OverlordPriority} from './priorities_overlords';

export class BoostrapMinerSetup extends CreepSetup {
	constructor() {
		super('miner', {
			pattern  : [WORK, WORK, CARRY, MOVE],
			sizeLimit: 1,
		});
	}
}

export class FillerSetup extends CreepSetup {
	constructor() {
		super('filler', {
			pattern  : [CARRY, CARRY, MOVE],
			sizeLimit: 2,
		});
	}
}

// Bootstrapping overlord: spawns small miners and suppliers to recover from a catastrohpic colony crash
export class BootstrappingOverlord extends Overlord {

	room!: Room; // Definitely has vision
	fillers: Zerg[];
	withdrawStructures: (StructureStorage | StructureTerminal | StructureContainer | StructureLink |
		StructureTower | StructureLab | StructurePowerSpawn | StructureNuker)[];
	supplyStructures: (StructureSpawn | StructureExtension)[];
	private settings: {
		spawnBootstrapMinerThreshold: number;
	};

	constructor(directive: DirectiveBootstrap, priority = OverlordPriority.emergency.bootstrap) {
		super(directive, 'bootstrap', priority);
		this.fillers = this.creeps('filler');
		// Calculate structures fillers can supply / withdraw from
		this.supplyStructures = _.filter([...this.colony.spawns, ...this.colony.extensions],
										 structure => structure.energy < structure.energyCapacity);
		this.withdrawStructures = _.filter(_.compact([this.colony.storage!,
													  this.colony.terminal!,
													  this.colony.powerSpawn!,
													  this.colony.nuker!,
													  ...this.colony.room.containers,
													  ...this.colony.links,
													  ...this.colony.towers,
													  ...this.colony.labs]), structure => structure.energy > 0);
		this.settings = {
			spawnBootstrapMinerThreshold: 1000,
		};
	}

	private spawnBootstrapMiners() {
		// Isolate mining site overlords in the room
		let miningSites = _.map(this.room.sources, source => this.colony.miningSites[source.id]);
		if (this.colony.spawns[0]) {
			miningSites = _.sortBy(miningSites, site => site.pos.getRangeTo(this.colony.spawns[0]));
		}
		let miningOverlords = _.map(miningSites, site => site.overlord) as MiningOverlord[];

		// Create a bootstrapMiners and donate them to the miningSite overlords as needed
		for (let overlord of miningOverlords) {
			let filteredMiners = this.lifetimeFilter(overlord.miners);
			let miningPowerAssigned = _.sum(_.map(this.lifetimeFilter(overlord.miners),
												  creep => creep.getActiveBodyparts(WORK)));
			if (miningPowerAssigned < overlord.miningSite.miningPowerNeeded &&
				filteredMiners.length < overlord.miningSite.pos.availableNeighbors().length) {
				let protoCreep = this.generateProtoCreep(new BoostrapMinerSetup());
				protoCreep.memory.overlord = overlord.ref; // Donate the miner to the miningSite
				if (this.colony.hatchery) {
					this.colony.hatchery.enqueue(protoCreep, this.priority);
				}
			}
		}
	}

	spawn() {
		// At early levels, spawn one miner, then a filler, then the rest of the miners
		if (this.colony.stage == ColonyStage.Larva) {
			if (this.colony.getCreepsByRole('miner').length == 0) {
				this.spawnBootstrapMiners();
			}
		}
		// Spawn fillers
		this.wishlist(1, new FillerSetup());
		// Then spawn the rest of the needed miners
		let energyInStructures = _.sum(_.map(this.withdrawStructures, structure => structure.energy));
		if (energyInStructures < this.settings.spawnBootstrapMinerThreshold) {
			this.spawnBootstrapMiners();
		}
	}

	init() {
		this.spawn();
	}

	private supplyActions(filler: Zerg) {
		let target = filler.pos.findClosestByRange(this.supplyStructures);
		if (target) {
			filler.task = Tasks.deposit(target);
		} else {
			this.rechargeActions(filler);
		}
	}

	private rechargeActions(filler: Zerg) {
		let target = filler.pos.findClosestByRange(this.withdrawStructures);
		if (target) filler.task = Tasks.withdraw(target);
	}

	private handleFiller(filler: Zerg) {
		if (filler.carry.energy > 0) {
			this.supplyActions(filler);
		} else {
			this.rechargeActions(filler);
		}
	}

	run() {
		for (let filler of this.fillers) {
			if (filler.isIdle) {
				this.handleFiller(filler);
			}
		}
	}
}