import { EC2Client, DescribeInstanceStatusCommand, DescribeAddressesCommand, DescribeInstancesCommand } from '@aws-sdk/client-ec2';


const client = new EC2Client({region: "ap-northeast-2"});

export const getDetailInstances =  async (instanceIds: Array<string>) => {
  const command = new DescribeInstancesCommand({InstanceIds: instanceIds});
  const response =  await client.send(command);
  console.log(response.NextToken);
  if(response.Reservations.length > 0) {
    const instances = response.Reservations[0].Instances;
    return instances;
  }
  return [];
};



export const getDetailInstancesAll =  async (instanceIds: Array<string>) => {
  
  const allInstance = [];
  await Promise.all(
    instanceIds.map(async (instanceId) =>  {
      const instances = await getDetailInstances2([instanceId]);
      allInstance.push(...instances);
    })
  )
  
  return allInstance;
};


export const getDetailInstances2 =  async (instanceIds: Array<string>) => {
  const command = new DescribeInstancesCommand({InstanceIds: instanceIds});
  const response =  await client.send(command);
  if(response.Reservations.length > 0) {
    const instances = response.Reservations[0].Instances;
    return instances;
  }
  return [];
};


export const getInstances = async () => {
  const command = new DescribeInstanceStatusCommand({IncludeAllInstances: true});

  const healthyIntances = new Array();
  const unhealthyIntances = new Array();

  try {
    const response = await client.send(command);
    const instacnes = response.InstanceStatuses;

    instacnes.forEach(async (instance) => {
      if(instance.InstanceStatus.Status === "ok") {
        healthyIntances.push(instance);
      }
      else {
        unhealthyIntances.push(instance);
      }
    });

    return instacnes;
    
    // return ({
    //   healthyIntances, unhealthyIntances
    // });
    
  }
  catch (err) {
    return err;
  }
}

export const getInstanceAddress = async () => {
  const command = new DescribeAddressesCommand({});

  try {
    const response = await client.send(command);
    const addresses = response.Addresses;
    return addresses;
  }
  catch (err) {
    return err;
  }
}