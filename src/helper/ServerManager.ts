import 'dotenv/config'
import { getDetailInstances, getDetailInstancesAll, getInstanceAddress, getInstances } from '../modules/instance';
import { getAutoScailingInfo } from '../modules/autoscale';
import { getTags } from '../modules/tags';
import LogManager from './LogManager';
import { getTargetGroup } from '../modules/elb';

interface IInstance {
  InstanceId: string,
  Name: string | null,
  AZ: string,
  Status: string,
  State: string,
  StateCode: number,
  PublicIp: string,
  PrivateIp: string | null,
  AutoScale: any,
  TargetGroup: IInstanceTargetGroup[]
}

interface ITargetGroup {
  Name: string,
  Group: IInstanceTargetGroup[]
}

interface IInstanceTargetGroup {
  Name: string,
  Port: number,
  State: string,
  Description: string
}

export default class ServerManager {
  servers: IInstance[];
  targetGroups: any[];
  logManager: LogManager;
  boot: any;
  isUpdate: boolean;

  constructor (boot, logManager) {
    this.update(boot);
    this.logManager = logManager;
    this.isUpdate = false;
    setInterval(() => {
      if(!this.isUpdate) this.update();
    }, 1000*10);
  }

  update (cb?: any) {
    this.isUpdate = true;
    getAWSInstances()
    .then((res) => {
      this.servers = res.servers;
      this.targetGroups = res.targetGroups;
      if(cb) cb(this);
      this.log();
      this.isUpdate = false;
    })
    .catch((err) => {
      console.log(err);
      this.isUpdate = false;
    });
  }

  log () {
    const targetLogInstance = this.servers.filter(instance => instance.AutoScale || instance.Name === "edge custom" || instance.Name === "MAIN");
    targetLogInstance.forEach((instance: IInstance) => {
      const findReader = this.logManager.find(instance.PrivateIp);
      if(!findReader) {
        const newReader = this.logManager.add(instance.PrivateIp);
      }
      else {
        // const result = this.logManager.delete(instance.PrivateIp);
      }
      
      // reader.subscribeLog(instance.PrivateIp, (log) => {
      //   console.log(log);
      // });
    });
  }
}

const getAWSTargetGroup = async () => {
  const targetGroups = await getTargetGroup();
  const groups = targetGroups.map((group) => ({Name: group.Name, Group: group.Group }));
  return groups;
}

const getAWSInstances = async () => {
  const instances = [];
  
  const allInstances = await getInstances();
  Array.prototype.push.apply(instances, allInstances.map(instance => 
    ({
      InstanceId: instance.InstanceId,
      Name: null,
      AZ: instance.AvailabilityZone,
      Status: instance.InstanceStatus.Status,
      State: instance.InstanceState.Name,
      StateCode: instance.InstanceState.Code,
      PublicIp: null,
      PrivateIp: null,
      AutoScale: null,
      TargetGroup: []
    })
  ));

  const allInstancesAddress = await getInstanceAddress();
  allInstancesAddress.forEach((instance) => {
    // console.log(instance);
    const idx = instances.findIndex(i => i.InstanceId === instance.InstanceId);
    if(idx < 0) return;
    const targetInstance = instances[idx];
    targetInstance.PrivateIp = instance.PrivateIpAddress;
    targetInstance.PublicIp = instance.PublicIp;
  });

  const tags = await getTags();
  const instanceTags = tags.filter(tag => tag.ResourceType === "instance" && tag.Key === "Name");
  instanceTags.forEach(tag => {
    const idx = instances.findIndex(i => i.InstanceId === tag.ResourceId);
    if(idx < 0) return;
    const targetInstance = instances[idx];
    targetInstance.Name = tag.Value;
  });

  const autoScaleInstances = await getAutoScailingInfo();
  // console.log(autoScaleInstances)
  autoScaleInstances.forEach((instance) => {
    const idx = instances.findIndex(i => i.InstanceId === instance.InstanceId);
    if(idx < 0) return;
    instances[idx].AutoScale = {
      AutoScalingGroupName: instance.AutoScalingGroupName,
      LifecycleState: instance.LifecycleState,
      HealthStatus: instance.HealthStatus
    }
  });

  const autoScaleInstancesDetail = await getDetailInstancesAll(autoScaleInstances.map(i => i.InstanceId));
  // console.log(autoScaleInstancesDetail)
  autoScaleInstancesDetail.forEach((instance) => {
    const targetInstance = instances.find(i => i.InstanceId === instance.InstanceId);
    targetInstance.PrivateIp = instance.PrivateIpAddress;
    targetInstance.PublicIp = instance.PublicIpAddress;
  });


  const targetGroups = await getTargetGroup();
  const groups = targetGroups.map((group) => ({Name: group.Name, Group: group.Group }));
  
  const customGroups: Array<ITargetGroup> = groups.map((g => {
    const group = g.Group.map(t => {
      const targetInstance: IInstance|undefined = instances.find(i => i.InstanceId === t.Target.Id);
      if(targetInstance === undefined) return;

      const tg:IInstanceTargetGroup = {
        Name: g.Name,
        Port: t.Target.Port,
        State: t.TargetHealth.State,
        Description: t.Description
      };
      targetInstance.TargetGroup.push(tg);
      return tg;
    });

    return ({
      Name: g.Name,
      Group: group
    });
  }))
  return {servers: instances, targetGroups: customGroups};
}
