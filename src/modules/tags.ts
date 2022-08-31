import { EC2Client, DescribeInstanceStatusCommand, DescribeAddressesCommand, DescribeTagsCommand } from '@aws-sdk/client-ec2';


const client = new EC2Client({region: "ap-northeast-2"});

export const getTags = async () => {
  const command = new DescribeTagsCommand({});
  const response = await client.send(command);
  return response.Tags;
}
